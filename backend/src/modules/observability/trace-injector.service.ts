import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface TraceContextDescriptor {
  version: string;
  traceId: string;
  spanId: string;
  traceFlags: string;
  parentSpanId?: string;
  tracestate?: string;
  baggage: Record<string, string>;
  isSampled: boolean;
}

export type KafkaHeadersMap = Record<string, string | Buffer | undefined>;

@Injectable()
export class TraceInjectorService {
  private readonly logger = new Logger(TraceInjectorService.name);

  private static readonly TRACEPARENT_REGEX = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

  /**
   * Generates a random 32-character hexadecimal trace ID (16 bytes).
   */
  public generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generates a random 16-character hexadecimal span ID (8 bytes).
   */
  public generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Creates a fresh root trace context.
   */
  public createRootContext(baggage: Record<string, string> = {}, sampled = true): TraceContextDescriptor {
    return {
      version: '00',
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      traceFlags: sampled ? '01' : '00',
      baggage,
      isSampled: sampled,
    };
  }

  /**
   * Formats a W3C traceparent header string from a context descriptor.
   */
  public formatTraceparent(context: TraceContextDescriptor): string {
    return `${context.version}-${context.traceId}-${context.spanId}-${context.traceFlags}`;
  }

  /**
   * Parses a standard W3C traceparent string into a context descriptor.
   */
  public parseTraceparent(traceparent: string): Omit<TraceContextDescriptor, 'baggage'> | null {
    if (!traceparent) return null;
    const match = TraceInjectorService.TRACEPARENT_REGEX.exec(traceparent.trim());
    if (!match) return null;

    const [, version, traceId, spanId, traceFlags] = match;

    // Check for invalid all-zero traceId or spanId per W3C specification
    if (/^0+$/.test(traceId) || /^0+$/.test(spanId)) {
      return null;
    }

    const isSampled = (parseInt(traceFlags, 16) & 0x01) === 0x01;

    return {
      version,
      traceId,
      spanId,
      traceFlags,
      isSampled,
    };
  }

  /**
   * Serializes a key-value record into a W3C baggage header string.
   */
  public serializeBaggage(baggage: Record<string, string>): string {
    return Object.entries(baggage)
      .map(([k, v]) => `${encodeURIComponent(k.trim())}=${encodeURIComponent(v.trim())}`)
      .join(',');
  }

  /**
   * Parses a W3C baggage header string into a key-value record.
   */
  public parseBaggage(baggageHeader?: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!baggageHeader) return result;

    const pairs = baggageHeader.split(',');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = decodeURIComponent(pair.substring(0, idx).trim());
        const val = decodeURIComponent(pair.substring(idx + 1).trim());
        if (key) {
          result[key] = val;
        }
      }
    }
    return result;
  }

  /**
   * Injects distributed context into Kafka record headers.
   */
  public injectIntoHeaders(context: TraceContextDescriptor, targetHeaders: KafkaHeadersMap = {}): KafkaHeadersMap {
    targetHeaders['traceparent'] = this.formatTraceparent(context);

    if (context.tracestate) {
      targetHeaders['tracestate'] = context.tracestate;
    }

    if (context.baggage && Object.keys(context.baggage).length > 0) {
      targetHeaders['baggage'] = this.serializeBaggage(context.baggage);
    }

    targetHeaders['x-correlation-id'] = context.traceId;
    return targetHeaders;
  }

  /**
   * Extracts distributed context from Kafka record headers.
   */
  public extractFromHeaders(headers: KafkaHeadersMap): TraceContextDescriptor | null {
    const rawTraceparent = this.readHeaderValue(headers['traceparent']);
    if (!rawTraceparent) return null;

    const parsed = this.parseTraceparent(rawTraceparent);
    if (!parsed) return null;

    const rawBaggage = this.readHeaderValue(headers['baggage']);
    const rawTracestate = this.readHeaderValue(headers['tracestate']);

    return {
      ...parsed,
      tracestate: rawTracestate || undefined,
      baggage: this.parseBaggage(rawBaggage),
    };
  }

  /**
   * Derives a child span context linked to parent trace.
   */
  public createChildContext(parent: TraceContextDescriptor, additionalBaggage: Record<string, string> = {}): TraceContextDescriptor {
    return {
      version: parent.version,
      traceId: parent.traceId,
      spanId: this.generateSpanId(),
      parentSpanId: parent.spanId,
      traceFlags: parent.traceFlags,
      tracestate: parent.tracestate,
      baggage: { ...parent.baggage, ...additionalBaggage },
      isSampled: parent.isSampled,
    };
  }

  private readHeaderValue(value: string | Buffer | undefined): string | undefined {
    if (!value) return undefined;
    if (Buffer.isBuffer(value)) {
      return value.toString('utf8');
    }
    return String(value);
  }
}
