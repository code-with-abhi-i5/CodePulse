import { TraceInjectorService } from './trace-injector.service';
import { EventTracingPropagatorService } from './event-tracing-propagator.service';

describe('EventTracingPropagatorService (#1413)', () => {
  let injector: TraceInjectorService;
  let propagator: EventTracingPropagatorService;

  beforeEach(() => {
    injector = new TraceInjectorService();
    propagator = new EventTracingPropagatorService(injector);
  });

  afterEach(() => {
    propagator.reset();
  });

  it('should generate valid W3C trace IDs and span IDs', () => {
    const traceId = injector.generateTraceId();
    const spanId = injector.generateSpanId();

    expect(traceId).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(traceId)).toBe(true);

    expect(spanId).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(spanId)).toBe(true);
  });

  it('should parse valid W3C traceparent strings and reject malformed ones', () => {
    const valid = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    const parsed = injector.parseTraceparent(valid);

    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe('00');
    expect(parsed?.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    expect(parsed?.spanId).toBe('00f067aa0ba902b7');
    expect(parsed?.isSampled).toBe(true);

    // Reject all-zero traceId (invalid per W3C specification)
    const allZero = '00-00000000000000000000000000000000-00f067aa0ba902b7-01';
    expect(injector.parseTraceparent(allZero)).toBeNull();

    // Reject garbage
    expect(injector.parseTraceparent('invalid-trace-header')).toBeNull();
  });

  it('should serialize and parse baggage correctly', () => {
    const baggage = {
      tenantId: 'acme-corp',
      userId: 'usr_9988',
      region: 'us-east-1',
    };

    const serialized = injector.serializeBaggage(baggage);
    expect(serialized).toContain('tenantId=acme-corp');
    expect(serialized).toContain('userId=usr_9988');

    const parsed = injector.parseBaggage(serialized);
    expect(parsed).toEqual(baggage);
  });

  it('should inject traceparent, baggage, and correlation headers into Kafka record', () => {
    const rootContext = injector.createRootContext({ user: 'alice' });
    const record = propagator.prepareProducerRecord(
      'telemetry.events',
      { action: 'compile' },
      rootContext,
      'key-1'
    );

    expect(record.topic).toBe('telemetry.events');
    expect(record.headers['traceparent']).toBe(injector.formatTraceparent(rootContext));
    expect(record.headers['baggage']).toBe('user=alice');
    expect(record.headers['x-correlation-id']).toBe(rootContext.traceId);

    const telemetry = propagator.getTelemetry();
    expect(telemetry.totalContextsInjected).toBe(1);
  });

  it('should extract context on consumer and create linked child span', () => {
    const rootContext = injector.createRootContext({ env: 'production' });
    const record = propagator.prepareProducerRecord(
      'orders.processed',
      { orderId: 'ord-123' },
      rootContext
    );

    const { childContext, isSynthetic } = propagator.processConsumerRecord(record);

    expect(isSynthetic).toBe(false);
    expect(childContext.traceId).toBe(rootContext.traceId);
    expect(childContext.parentSpanId).toBe(rootContext.spanId);
    expect(childContext.spanId).not.toBe(rootContext.spanId);
    expect(childContext.baggage.env).toBe('production');
    expect(childContext.baggage.consumer_span).toBe('kafka.consume');

    const telemetry = propagator.getTelemetry();
    expect(telemetry.totalContextsExtracted).toBe(1);
    expect(telemetry.traceContinuityRatio).toBe(1.0);
  });

  it('should fallback to synthetic root trace when incoming record has no headers', () => {
    const rawRecord = {
      topic: 'legacy.topic',
      value: { data: 'legacy' },
      headers: {},
    };

    const { childContext, isSynthetic } = propagator.processConsumerRecord(rawRecord);

    expect(isSynthetic).toBe(true);
    expect(childContext.traceId).toBeDefined();
    expect(childContext.baggage.synthetic_trace).toBe('true');
    expect(childContext.baggage.inferred_topic).toBe('legacy.topic');

    const telemetry = propagator.getTelemetry();
    expect(telemetry.totalSyntheticTracesCreated).toBe(1);
    expect(telemetry.totalContextsExtracted).toBe(0);
  });
});
