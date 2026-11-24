import { Injectable, Logger } from '@nestjs/common';
import { OtelInitializerService, TraceContext } from './otel-initializer.service';

export type SpanKind = 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER' | 'INTERNAL';
export type SpanStatus = 'OK' | 'ERROR' | 'UNSET';

export interface SpanRecord {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  startTimeUs: bigint;
  endTimeUs?: bigint;
  durationMs?: number;
  status: SpanStatus;
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
  events: Array<{ name: string; timestampUs: bigint; attributes?: Record<string, any> }>;
}

@Injectable()
export class DistributedTracingService {
  private readonly logger = new Logger(DistributedTracingService.name);
  private activeSpans = new Map<string, SpanRecord>();
  private completedSpans: SpanRecord[] = [];
  private readonly MAX_RETAINED_SPANS = 5000;

  constructor(private readonly otelInit: OtelInitializerService) {}

  /**
   * Starts a new distributed trace span, adopting parent context if present.
   */
  public startSpan(
    name: string,
    options: {
      parentContext?: TraceContext;
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
    } = {},
  ): { span: SpanRecord; context: TraceContext } {
    const parent = options.parentContext;
    const traceId = parent?.traceId || this.otelInit.generateTraceId();
    const spanId = this.otelInit.generateSpanId();
    const parentSpanId = parent?.spanId;

    const span: SpanRecord = {
      spanId,
      traceId,
      parentSpanId,
      name,
      kind: options.kind || 'INTERNAL',
      startTimeUs: process.hrtime.bigint(),
      status: 'UNSET',
      attributes: {
        'service.name': 'codepulse-backend',
        'telemetry.sdk.language': 'nodejs',
        ...(options.attributes || {}),
      },
      events: [],
    };

    this.activeSpans.set(spanId, span);

    const context: TraceContext = {
      traceId,
      spanId,
      traceFlags: parent?.traceFlags || '01',
      traceState: parent?.traceState,
      baggage: parent?.baggage ? new Map(parent.baggage) : new Map(),
    };

    return { span, context };
  }

  /**
   * Records an in-span event or annotation.
   */
  public addEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({
        name: eventName,
        timestampUs: process.hrtime.bigint(),
        attributes,
      });
    }
  }

  /**
   * Completes a span, computing high-resolution duration in milliseconds and dispatching to export buffer.
   */
  public endSpan(
    spanId: string,
    status: SpanStatus = 'OK',
    errorMessage?: string,
  ): SpanRecord | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    const endUs = process.hrtime.bigint();
    span.endTimeUs = endUs;
    span.durationMs = Number(endUs - span.startTimeUs) / 1_000_000;
    span.status = status;
    if (errorMessage) {
      span.statusMessage = errorMessage;
      span.attributes['error'] = true;
      span.attributes['error.message'] = errorMessage;
    }

    this.activeSpans.delete(spanId);

    // Retain in ring buffer
    this.completedSpans.push(span);
    if (this.completedSpans.length > this.MAX_RETAINED_SPANS) {
      this.completedSpans.shift();
    }

    return span;
  }

  /**
   * Executes an asynchronous operation wrapped in an auto-ending span.
   */
  public async traceAsync<T>(
    spanName: string,
    operation: (spanContext: TraceContext) => Promise<T>,
    options: {
      parentContext?: TraceContext;
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
    } = {},
  ): Promise<T> {
    const { span, context } = this.startSpan(spanName, options);
    try {
      const result = await operation(context);
      this.endSpan(span.spanId, 'OK');
      return result;
    } catch (err: any) {
      this.endSpan(span.spanId, 'ERROR', err?.message || 'Unknown error');
      throw err;
    }
  }

  /**
   * Returns recent completed spans matching query criteria for tracing correlation.
   */
  public queryTraces(filter?: {
    traceId?: string;
    name?: string;
    hasErrorsOnly?: boolean;
    limit?: number;
  }): SpanRecord[] {
    let result = [...this.completedSpans];
    if (filter?.traceId) {
      result = result.filter((s) => s.traceId === filter.traceId);
    }
    if (filter?.name) {
      result = result.filter((s) => s.name === filter.name);
    }
    if (filter?.hasErrorsOnly) {
      result = result.filter((s) => s.status === 'ERROR');
    }
    const limit = filter?.limit || 50;
    return result.slice(-limit);
  }
}
