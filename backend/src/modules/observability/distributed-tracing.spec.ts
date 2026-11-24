import { OtelInitializerService } from './otel-initializer.service';
import { DistributedTracingService } from './distributed-tracing.service';

describe('DistributedTracingService & OtelInitializerService', () => {
  let otelService: OtelInitializerService;
  let tracingService: DistributedTracingService;

  beforeEach(() => {
    otelService = new OtelInitializerService();
    tracingService = new DistributedTracingService(otelService);
    otelService.initializeTracing();
  });

  afterEach(() => {
    otelService.shutdownTracing();
  });

  describe('OtelInitializerService', () => {
    it('should generate valid 32-char hex trace IDs and 16-char hex span IDs', () => {
      const traceId = otelService.generateTraceId();
      const spanId = otelService.generateSpanId();

      expect(traceId).toHaveLength(32);
      expect(spanId).toHaveLength(16);
      expect(traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(spanId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should accurately parse valid W3C traceparent headers', () => {
      const rawHeader = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const context = otelService.parseTraceParent(rawHeader);

      expect(context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(context.spanId).toBe('00f067aa0ba902b7');
      expect(context.traceFlags).toBe('01');
    });

    it('should generate fresh IDs when traceparent header is missing or malformed', () => {
      const malformedHeader = 'invalid-header';
      const context = otelService.parseTraceParent(malformedHeader);

      expect(context.traceId).toHaveLength(32);
      expect(context.spanId).toHaveLength(16);
      expect(context.traceFlags).toBe('01');
    });

    it('should format TraceContext to standard W3C traceparent string', () => {
      const context = {
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        spanId: '00f067aa0ba902b7',
        traceFlags: '01',
        baggage: new Map(),
      };

      const header = otelService.formatTraceParent(context);
      expect(header).toBe('00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01');
    });
  });

  describe('DistributedTracingService', () => {
    it('should create root span and child spans inheriting traceId', () => {
      const root = tracingService.startSpan('http_request', { kind: 'SERVER' });
      const child = tracingService.startSpan('db_query', {
        parentContext: root.context,
        kind: 'CLIENT',
        attributes: { 'db.system': 'postgresql' },
      });

      expect(child.span.traceId).toBe(root.span.traceId);
      expect(child.span.parentSpanId).toBe(root.span.spanId);
      expect(child.span.attributes['db.system']).toBe('postgresql');
    });

    it('should track duration and record span events', () => {
      const { span } = tracingService.startSpan('process_job');
      tracingService.addEvent(span.spanId, 'cache_hit', { key: 'usr_123' });

      const completed = tracingService.endSpan(span.spanId, 'OK');
      expect(completed).toBeDefined();
      expect(completed?.durationMs).toBeGreaterThanOrEqual(0);
      expect(completed?.status).toBe('OK');
      expect(completed?.events.length).toBe(1);
      expect(completed?.events[0].name).toBe('cache_hit');
    });

    it('should capture exceptions and mark span status as ERROR in traceAsync', async () => {
      await expect(
        tracingService.traceAsync('failing_operation', async () => {
          throw new Error('Database connection failed');
        }),
      ).rejects.toThrow('Database connection failed');

      const failedTraces = tracingService.queryTraces({ hasErrorsOnly: true });
      expect(failedTraces.length).toBeGreaterThan(0);
      expect(failedTraces[failedTraces.length - 1].status).toBe('ERROR');
      expect(failedTraces[failedTraces.length - 1].statusMessage).toBe('Database connection failed');
    });
  });
});
