import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  TraceInjectorService,
  TraceContextDescriptor,
  KafkaHeadersMap,
} from './trace-injector.service';

export interface TracedKafkaRecord<T = any> {
  topic: string;
  key?: string;
  value: T;
  headers: KafkaHeadersMap;
}

export interface PropagationTelemetry {
  totalContextsInjected: number;
  totalContextsExtracted: number;
  totalSyntheticTracesCreated: number;
  activeTraceChainsCount: number;
  traceContinuityRatio: number;
}

@Injectable()
export class EventTracingPropagatorService {
  private readonly logger = new Logger(EventTracingPropagatorService.name);

  private totalInjected = 0;
  private totalExtracted = 0;
  private totalSynthetic = 0;

  private readonly injector: TraceInjectorService;

  constructor(
    @Optional() injector?: TraceInjectorService
  ) {
    this.injector = injector || new TraceInjectorService();
  }

  /**
   * Producer Wrapper: Injects active distributed trace context and baggage into Kafka record headers.
   */
  public prepareProducerRecord<T>(
    topic: string,
    value: T,
    activeContext?: TraceContextDescriptor,
    key?: string,
    existingHeaders: KafkaHeadersMap = {}
  ): TracedKafkaRecord<T> {
    const contextToInject = activeContext || this.injector.createRootContext({}, true);

    const headers = this.injector.injectIntoHeaders(contextToInject, { ...existingHeaders });
    this.totalInjected++;

    this.logger.debug(
      `Injected trace ${contextToInject.traceId} (span: ${contextToInject.spanId}) into topic ${topic}`
    );

    return {
      topic,
      key,
      value,
      headers,
    };
  }

  /**
   * Consumer Wrapper: Extracts trace context from Kafka headers, linking consumer processing
   * to producer span graph. Falls back to synthetic root context if headers are missing.
   */
  public processConsumerRecord<T>(
    record: TracedKafkaRecord<T>,
    consumerSpanName = 'kafka.consume'
  ): { childContext: TraceContextDescriptor; isSynthetic: boolean } {
    let parentContext = this.injector.extractFromHeaders(record.headers);
    let isSynthetic = false;

    if (!parentContext) {
      // Fallback: Generate synthetic root context with diagnostic flag
      parentContext = this.injector.createRootContext({
        synthetic_trace: 'true',
        inferred_topic: record.topic,
      });
      this.totalSynthetic++;
      isSynthetic = true;
      this.logger.warn(
        `Kafka record from topic '${record.topic}' lacked traceparent headers. Created synthetic root trace ${parentContext.traceId}.`
      );
    } else {
      this.totalExtracted++;
    }

    const childContext = this.injector.createChildContext(parentContext, {
      consumer_span: consumerSpanName,
      consumed_at: Date.now().toString(),
    });

    return { childContext, isSynthetic };
  }

  /**
   * Returns current tracing propagation telemetry.
   */
  public getTelemetry(): PropagationTelemetry {
    const totalProcessed = this.totalExtracted + this.totalSynthetic;
    const continuityRatio = totalProcessed > 0 ? this.totalExtracted / totalProcessed : 1.0;

    return {
      totalContextsInjected: this.totalInjected,
      totalContextsExtracted: this.totalExtracted,
      totalSyntheticTracesCreated: this.totalSynthetic,
      activeTraceChainsCount: this.totalInjected + this.totalExtracted,
      traceContinuityRatio: Math.round(continuityRatio * 1000) / 1000,
    };
  }

  public reset(): void {
    this.totalInjected = 0;
    this.totalExtracted = 0;
    this.totalSynthetic = 0;
  }
}
