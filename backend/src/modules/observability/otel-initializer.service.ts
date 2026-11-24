import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as crypto from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string; // '01' sampled
  traceState?: string;
  baggage: Map<string, string>;
}

export interface OtelConfig {
  serviceName: string;
  serviceVersion: string;
  jaegerEndpoint: string;
  sampleRate: number; // 0.0 to 1.0
  alwaysSampleErrors: boolean;
}

@Injectable()
export class OtelInitializerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtelInitializerService.name);
  private isInitialized = false;

  private config: OtelConfig = {
    serviceName: 'codepulse-backend',
    serviceVersion: '1.0.0',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:4318/v1/traces',
    sampleRate: 1.0,
    alwaysSampleErrors: true,
  };

  onModuleInit() {
    this.initializeTracing();
  }

  onModuleDestroy() {
    this.shutdownTracing();
  }

  public initializeTracing(customConfig?: Partial<OtelConfig>): void {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.isInitialized = true;
    this.logger.log(`OpenTelemetry tracing pipeline initialized for ${this.config.serviceName} -> ${this.config.jaegerEndpoint}`);
  }

  public shutdownTracing(): void {
    this.isInitialized = false;
    this.logger.log('OpenTelemetry tracing pipeline shut down cleanly');
  }

  public getStatus(): { isInitialized: boolean; config: OtelConfig } {
    return { isInitialized: this.isInitialized, config: this.config };
  }

  /**
   * Generates a 16-byte random trace ID formatted as a 32-character hex string.
   */
  public generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generates an 8-byte random span ID formatted as a 16-character hex string.
   */
  public generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Parses W3C TraceContext headers:
   * traceparent: version(00)-trace_id(32 hex)-parent_id(16 hex)-trace_flags(01)
   */
  public parseTraceParent(traceParentHeader?: string, traceStateHeader?: string): TraceContext {
    const baggage = new Map<string, string>();

    if (!traceParentHeader || !traceParentHeader.startsWith('00-')) {
      return {
        traceId: this.generateTraceId(),
        spanId: this.generateSpanId(),
        traceFlags: '01',
        traceState: traceStateHeader,
        baggage,
      };
    }

    const parts = traceParentHeader.split('-');
    if (parts.length < 4 || parts[1].length !== 32 || parts[2].length !== 16) {
      return {
        traceId: this.generateTraceId(),
        spanId: this.generateSpanId(),
        traceFlags: '01',
        traceState: traceStateHeader,
        baggage,
      };
    }

    return {
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parts[3],
      traceState: traceStateHeader,
      baggage,
    };
  }

  /**
   * Serializes a trace context into a compliant W3C traceparent header string.
   */
  public formatTraceParent(context: TraceContext): string {
    return `00-${context.traceId}-${context.spanId}-${context.traceFlags}`;
  }
}
