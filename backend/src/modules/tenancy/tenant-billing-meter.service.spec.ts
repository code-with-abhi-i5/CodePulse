import {
  TenantBillingMeterService,
  BillingTier,
  RawUsageEvent,
  BillingRateCard,
  ExponentialBackoffExecutor,
  BillingCircuitBreaker,
  InMemoryDeadLetterQueue,
  DefaultOpenTelemetryTracer,
  PrometheusMetricsRegistry,
  StructuredWinstonLogger,
  InMemoryBillingStorageProvider,
  BillingCircuitBreakerOpenException,
  InvalidUsageEventException,
  CircuitState,
} from './tenant-billing-meter.service';

describe('TenantBillingMeterService (Comprehensive Unit & Integration Test Suite)', () => {
  let service: TenantBillingMeterService;
  let storage: InMemoryBillingStorageProvider;
  let dlq: InMemoryDeadLetterQueue;
  let circuitBreaker: BillingCircuitBreaker;
  let tracer: DefaultOpenTelemetryTracer;
  let metrics: PrometheusMetricsRegistry;
  let winstonLogger: StructuredWinstonLogger;
  let now: number;

  beforeEach(() => {
    storage = new InMemoryBillingStorageProvider();
    dlq = new InMemoryDeadLetterQueue();
    circuitBreaker = new BillingCircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 500,
      halfOpenSuccessThreshold: 2,
    });
    tracer = new DefaultOpenTelemetryTracer();
    metrics = new PrometheusMetricsRegistry();
    winstonLogger = new StructuredWinstonLogger();

    service = new TenantBillingMeterService({
      storageProvider: storage,
      dlq,
      circuitBreaker,
      tracer,
      metrics,
      winstonLogger,
      retryPolicy: {
        maxRetries: 2,
        initialBackoffMs: 10,
        maxBackoffMs: 100,
        backoffMultiplier: 2.0,
        enableJitter: false,
      },
    });

    now = 1700000000000;
  });

  // ==========================================================================
  // 1. Core Service Logic & Allowance Arithmetic
  // ==========================================================================
  describe('Core Service Logic & Billing Calculations', () => {
    it('ingests resource events and computes billable overage after baseline allowance', async () => {
      // FREE tier compute allowance = 3600 seconds, rate = $0.00005
      // 5000 seconds -> 1400 billable @ $0.00005 = $0.0700
      const event: RawUsageEvent = {
        eventId: 'evt_1',
        idempotencyKey: 'idem_compute_1',
        tenantId: 'tenant_alpha',
        dimension: 'COMPUTE_SECONDS',
        units: 5000,
        timestamp: now,
      };

      const result = await service.ingestUsageEvent(event, now);
      expect(result.accepted).toBe(true);

      const statement = await service.generateStatement('tenant_alpha', 'FREE', now - 1000, now + 1000, 0.0, now);

      expect(statement.tenantId).toBe('tenant_alpha');
      expect(statement.tier).toBe('FREE');
      expect(statement.subtotalUsd).toBe(0.07);
      expect(statement.totalUsd).toBe(0.07);

      const computeItem = statement.items.find((i) => i.dimension === 'COMPUTE_SECONDS');
      expect(computeItem).toBeDefined();
      expect(computeItem?.consumedUnits).toBe(5000);
      expect(computeItem?.allowanceUnits).toBe(3600);
      expect(computeItem?.billableUnits).toBe(1400);
      expect(computeItem?.totalCostUsd).toBe(0.07);
    });

    it('applies custom rate cards with overage multipliers and tax rate calculations', async () => {
      const customRateCard: BillingRateCard = {
        tier: 'STARTER',
        dimensionRates: {
          COMPUTE_SECONDS: 0.0001,
          MEMORY_MB_SECONDS: 0.00001,
          STORAGE_GIGABYTES: 0.2,
          NETWORK_EGRESS_GB: 0.1,
          API_INVOCATIONS: 0.00002,
          AI_TOKENS: 0.00001,
        },
        includedAllowances: {
          COMPUTE_SECONDS: 1000,
          MEMORY_MB_SECONDS: 0,
          STORAGE_GIGABYTES: 10,
          NETWORK_EGRESS_GB: 0,
          API_INVOCATIONS: 0,
          AI_TOKENS: 0,
        },
        overageMultipliers: {
          COMPUTE_SECONDS: 1.5, // 1.5x overage penalty
        },
      };
      service.registerRateCard(customRateCard);

      // Ingest 2000 compute seconds (1000 allowance, 1000 overage * 0.0001 * 1.5 = $0.15)
      await service.ingestUsageEvent({
        eventId: 'evt_multiplier',
        idempotencyKey: 'idem_mult',
        tenantId: 'tenant_special',
        dimension: 'COMPUTE_SECONDS',
        units: 2000,
        timestamp: now,
      });

      // 10% tax rate
      const statement = await service.generateStatement('tenant_special', 'STARTER', now - 1000, now + 1000, 0.1, now);

      expect(statement.subtotalUsd).toBe(0.15);
      expect(statement.taxUsd).toBe(0.015);
      expect(statement.totalUsd).toBe(0.165);
    });

    it('handles zero usage boundary condition (statement total = $0)', async () => {
      const statement = await service.generateStatement('tenant_idle', 'PRO', now - 1000, now + 1000, 0.0, now);

      expect(statement.subtotalUsd).toBe(0);
      expect(statement.totalUsd).toBe(0);
      for (const item of statement.items) {
        expect(item.consumedUnits).toBe(0);
        expect(item.billableUnits).toBe(0);
        expect(item.totalCostUsd).toBe(0);
      }
    });

    it('handles exact allowance threshold boundary (consumed == allowance, billable = 0)', async () => {
      // PRO tier AI_TOKENS allowance = 500,000
      await service.ingestUsageEvent({
        eventId: 'evt_exact',
        idempotencyKey: 'idem_exact',
        tenantId: 'tenant_pro',
        dimension: 'AI_TOKENS',
        units: 500000,
        timestamp: now,
      });

      const statement = await service.generateStatement('tenant_pro', 'PRO', now - 1000, now + 1000, 0.0, now);
      const aiItem = statement.items.find((i) => i.dimension === 'AI_TOKENS');

      expect(aiItem?.consumedUnits).toBe(500000);
      expect(aiItem?.allowanceUnits).toBe(500000);
      expect(aiItem?.billableUnits).toBe(0);
      expect(aiItem?.totalCostUsd).toBe(0);
    });

    it('rejects negative consumption units with InvalidUsageEventException', async () => {
      await expect(
        service.ingestUsageEvent({
          eventId: 'evt_neg',
          idempotencyKey: 'idem_neg',
          tenantId: 'tenant_err',
          dimension: 'COMPUTE_SECONDS',
          units: -100,
          timestamp: now,
        }),
      ).rejects.toThrow(InvalidUsageEventException);
    });
  });

  // ==========================================================================
  // 2. Idempotency & Deduplication
  // ==========================================================================
  describe('Idempotency & Deduplication', () => {
    it('deduplicates identical idempotency keys to ensure exact-once billing', async () => {
      const event: RawUsageEvent = {
        eventId: 'evt_dup_1',
        idempotencyKey: 'token_replay_unique',
        tenantId: 'tenant_dedup',
        dimension: 'API_INVOCATIONS',
        units: 5000,
        timestamp: now,
      };

      const first = await service.ingestUsageEvent(event, now);
      expect(first.accepted).toBe(true);
      expect(first.deduplicated).toBeFalsy();

      const second = await service.ingestUsageEvent(event, now);
      expect(second.accepted).toBe(false);
      expect(second.deduplicated).toBe(true);

      const usage = await service.aggregateUsage('tenant_dedup', now - 1000, now + 1000);
      expect(usage.dimensions.API_INVOCATIONS).toBe(5000);
      expect(usage.totalEventsCount).toBe(1);
    });
  });

  // ==========================================================================
  // 3. Resilience: Exponential Backoff Retries
  // ==========================================================================
  describe('Resilience: Exponential Backoff Retries', () => {
    it('calculates exponential delays correctly with clamping and jitter options', () => {
      expect(ExponentialBackoffExecutor.calculateDelay(0, 50, 1000, 2.0, false)).toBe(50);
      expect(ExponentialBackoffExecutor.calculateDelay(1, 50, 1000, 2.0, false)).toBe(100);
      expect(ExponentialBackoffExecutor.calculateDelay(2, 50, 1000, 2.0, false)).toBe(200);
      expect(ExponentialBackoffExecutor.calculateDelay(3, 50, 1000, 2.0, false)).toBe(400);
      expect(ExponentialBackoffExecutor.calculateDelay(4, 50, 1000, 2.0, false)).toBe(800);
      expect(ExponentialBackoffExecutor.calculateDelay(5, 50, 1000, 2.0, false)).toBe(1000); // clamped

      const jitterRandom = () => 0.25;
      expect(ExponentialBackoffExecutor.calculateDelay(2, 50, 1000, 2.0, true, jitterRandom)).toBe(50); // 200 * 0.25
    });

    it('recovers on transient storage failure after retry attempts', async () => {
      let attempts = 0;
      const mockSleep = jest.fn().mockResolvedValue(undefined);

      const res = await ExponentialBackoffExecutor.executeWithRetry<string>(
        async (attempt: number) => {
          attempts++;
          if (attempt < 2) {
            throw new Error('ECONNRESET: Socket closed abruptly');
          }
          return 'SUCCESS_AFTER_RETRY';
        },
        {
          maxRetries: 3,
          initialBackoffMs: 20,
          maxBackoffMs: 200,
          backoffMultiplier: 2.0,
          enableJitter: false,
          isRetryable: (err) => err.message.includes('ECONNRESET'),
        },
        undefined,
        mockSleep,
      );

      expect(res).toBe('SUCCESS_AFTER_RETRY');
      expect(attempts).toBe(3);
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it('fails fast on non-retryable billing errors without waiting for retries', async () => {
      let attempts = 0;
      const mockSleep = jest.fn().mockResolvedValue(undefined);

      await expect(
        ExponentialBackoffExecutor.executeWithRetry<string>(
          async () => {
            attempts++;
            throw new Error('ORGANIZATION_SUSPENDED_NON_RETRYABLE');
          },
          {
            maxRetries: 3,
            initialBackoffMs: 20,
            maxBackoffMs: 200,
            backoffMultiplier: 2.0,
            enableJitter: false,
            isRetryable: (err) => err.message.includes('ECONNRESET'),
          },
          undefined,
          mockSleep,
        ),
      ).rejects.toThrow('ORGANIZATION_SUSPENDED_NON_RETRYABLE');

      expect(attempts).toBe(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 4. Resilience: Circuit Breaker State Transitions
  // ==========================================================================
  describe('Resilience: Circuit Breaker State Transitions', () => {
    it('starts CLOSED, trips to OPEN at failure threshold, and rejects calls while OPEN', async () => {
      const cb = new BillingCircuitBreaker({
        failureThreshold: 2,
        recoveryTimeoutMs: 500,
        halfOpenSuccessThreshold: 1,
      });

      expect(cb.getState(1000)).toBe('CLOSED');

      // Failure 1
      await expect(cb.execute(async () => { throw new Error('Storage outage 1'); }, 1000)).rejects.toThrow('Storage outage 1');
      expect(cb.getState(1000)).toBe('CLOSED');

      // Failure 2 -> Trips to OPEN
      await expect(cb.execute(async () => { throw new Error('Storage outage 2'); }, 1000)).rejects.toThrow('Storage outage 2');
      expect(cb.getState(1000)).toBe('OPEN');

      // Fast rejection while OPEN
      await expect(cb.execute(async () => 'not executed', 1100)).rejects.toThrow(BillingCircuitBreakerOpenException);
    });

    it('recovers from OPEN to HALF_OPEN after timeout, then closes on probe success', async () => {
      const cb = new BillingCircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 300,
        halfOpenSuccessThreshold: 2,
      });

      await expect(cb.execute(async () => { throw new Error('Fail'); }, 1000)).rejects.toThrow('Fail');
      expect(cb.getState(1000)).toBe('OPEN');

      // Before recovery timeout
      expect(cb.getState(1200)).toBe('OPEN');

      // After recovery timeout: transitions to HALF_OPEN
      expect(cb.getState(1350)).toBe('HALF_OPEN');

      // Probe 1 success
      const probe1 = await cb.execute(async () => 'probe_1_ok', 1350);
      expect(probe1).toBe('probe_1_ok');
      expect(cb.getState(1350)).toBe('HALF_OPEN');

      // Probe 2 success -> resets to CLOSED
      const probe2 = await cb.execute(async () => 'probe_2_ok', 1350);
      expect(probe2).toBe('probe_2_ok');
      expect(cb.getState(1350)).toBe('CLOSED');
    });

    it('immediately trips back to OPEN if probe fails in HALF_OPEN', async () => {
      const cb = new BillingCircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 200,
        halfOpenSuccessThreshold: 2,
      });

      cb.trip(1000);
      expect(cb.getState(1250)).toBe('HALF_OPEN');

      await expect(cb.execute(async () => { throw new Error('Probe failed'); }, 1250)).rejects.toThrow('Probe failed');
      expect(cb.getState(1250)).toBe('OPEN');
    });
  });

  // ==========================================================================
  // 5. Resilience: Dead Letter Queue (DLQ)
  // ==========================================================================
  describe('Resilience: Dead Letter Queue (DLQ)', () => {
    it('captures poisoned billing events and replays successfully upon resolution', async () => {
      const deadQueue = new InMemoryDeadLetterQueue();

      await deadQueue.enqueue({
        recordId: 'dlq_evt_1',
        tenantId: 'tenant_bad_payload',
        payload: { invalidFormat: true },
        failureReason: 'ECONNRESET: downstream storage timeout',
        stackTrace: 'Error: ECONNRESET at BillingStorage.save',
        attempts: 3,
        firstFailedAt: now - 3000,
        lastFailedAt: now,
        isRetryable: false,
      });

      expect(deadQueue.getRecordCount()).toBe(1);
      expect(deadQueue.getRecordCount('tenant_bad_payload')).toBe(1);
      expect(deadQueue.getRecordCount('other_tenant')).toBe(0);

      // Replay handler succeeds
      const processed = await deadQueue.replay('dlq_evt_1', async (record) => {
        expect(record.recordId).toBe('dlq_evt_1');
        return true;
      });

      expect(processed).toBe(true);
      expect(deadQueue.getRecordCount()).toBe(0);
    });

    it('retains record in DLQ on failed replay and purges when requested', async () => {
      const deadQueue = new InMemoryDeadLetterQueue();
      await deadQueue.enqueue({
        recordId: 'dlq_unfixable',
        tenantId: 'tenant_fatal',
        payload: {},
        failureReason: 'Permanent schema error',
        attempts: 1,
        firstFailedAt: now,
        lastFailedAt: now,
        isRetryable: false,
      });

      const processed = await deadQueue.replay('dlq_unfixable', async () => false);
      expect(processed).toBe(false);
      expect(deadQueue.getRecordCount()).toBe(1);

      const purged = deadQueue.purge('tenant_fatal');
      expect(purged).toBe(1);
      expect(deadQueue.getRecordCount()).toBe(0);
    });
  });

  // ==========================================================================
  // 6. Telemetry & Observability
  // ==========================================================================
  describe('Telemetry & Observability Integration', () => {
    it('creates OpenTelemetry trace spans with contextual metadata', async () => {
      await service.ingestUsageEvent({
        eventId: 'evt_span',
        idempotencyKey: 'idem_span',
        tenantId: 'tenant_otel',
        dimension: 'STORAGE_GIGABYTES',
        units: 50,
        timestamp: now,
      });

      const span = tracer.getLastSpan();
      expect(span).toBeDefined();
      expect(span?.name).toBe('tenant_billing.ingest_usage_event');
      expect(span?.getAttribute('tenant_billing.tenant_id')).toBe('tenant_otel');
      expect(span?.getAttribute('tenant_billing.dimension')).toBe('STORAGE_GIGABYTES');
      expect(span?.getAttribute('tenant_billing.units')).toBe(50);
      expect(span?.status.code).toBe('OK');
      expect(span?.ended).toBe(true);
    });

    it('exports Prometheus metrics conforming to official exposition standards', () => {
      metrics.incrementUsageEvents('tenant_metric', 'COMPUTE_SECONDS', 10);
      metrics.incrementUnitsConsumed('tenant_metric', 'COMPUTE_SECONDS', 3600);
      metrics.incrementRevenueAccrued('tenant_metric', 'PRO', 49.99);
      metrics.incrementErrors('tenant_metric', 'STORAGE_TIMEOUT');
      metrics.incrementDlqEvents('tenant_metric', 1);
      metrics.setCircuitBreakerState('ingest', 'CLOSED');
      metrics.observeComputationDuration('tenant_metric', 0.045);

      const exposition = metrics.exportMetrics();

      expect(exposition).toContain('# HELP codepulse_tenant_billing_usage_events_total');
      expect(exposition).toContain('# TYPE codepulse_tenant_billing_usage_events_total counter');
      expect(exposition).toContain('codepulse_tenant_billing_usage_events_total{tenant_id="tenant_metric",dimension="COMPUTE_SECONDS"} 10');
      expect(exposition).toContain('codepulse_tenant_billing_units_consumed_total{tenant_id="tenant_metric",dimension="COMPUTE_SECONDS"} 3600');
      expect(exposition).toContain('codepulse_tenant_billing_revenue_accrued_usd_total{tenant_id="tenant_metric",tier="PRO"} 49.99');
      expect(exposition).toContain('codepulse_tenant_billing_errors_total{tenant_id="tenant_metric",error_type="STORAGE_TIMEOUT"} 1');
      expect(exposition).toContain('codepulse_tenant_billing_dlq_events_total{tenant_id="tenant_metric"} 1');
      expect(exposition).toContain('codepulse_tenant_billing_circuit_breaker_state{circuit="ingest",state="CLOSED"} 0');
      expect(exposition).toContain('codepulse_tenant_billing_computation_duration_seconds{tenant_id="tenant_metric"} 0.045');
    });

    it('emits structured Winston logs for lifecycle events', async () => {
      await service.ingestUsageEvent({
        eventId: 'evt_log',
        idempotencyKey: 'idem_log',
        tenantId: 'tenant_winston',
        dimension: 'AI_TOKENS',
        units: 12000,
        timestamp: now,
      });

      await service.generateStatement('tenant_winston', 'FREE', now - 1000, now + 1000, 0.0, now);

      const events = winstonLogger.events;
      expect(events.some((e) => e.event === 'USAGE_EVENT_INGESTED')).toBe(true);
      expect(events.some((e) => e.event === 'USAGE_AGGREGATED')).toBe(true);
      expect(events.some((e) => e.event === 'STATEMENT_GENERATED' && e.tenantId === 'tenant_winston')).toBe(true);
    });
  });

  // ==========================================================================
  // 7. End-to-End Failure & Circuit Rejection
  // ==========================================================================
  describe('End-to-End Failure Modes & DLQ Dispatch', () => {
    it('rejects ingest calls when circuit breaker is tripped', async () => {
      circuitBreaker.trip(now);

      const res = await service.ingestUsageEvent(
        {
          eventId: 'evt_trip',
          idempotencyKey: 'idem_trip',
          tenantId: 'tenant_blocked',
          dimension: 'COMPUTE_SECONDS',
          units: 100,
          timestamp: now,
        },
        now,
      );

      expect(res.accepted).toBe(false);
      expect(res.error).toBe('Circuit breaker is OPEN');
    });

    it('captures storage exceptions and forwards failed events to DLQ', async () => {
      const failingStorage: InMemoryBillingStorageProvider = {
        ...storage,
        saveUsageEvent: jest.fn().mockRejectedValue(new Error('DATABASE_STORAGE_CRITICAL_FAILURE')),
      } as unknown as InMemoryBillingStorageProvider;

      const failingService = new TenantBillingMeterService({
        storageProvider: failingStorage,
        dlq,
        circuitBreaker,
        tracer,
        metrics,
        winstonLogger,
        retryPolicy: { maxRetries: 0, initialBackoffMs: 10, maxBackoffMs: 20, backoffMultiplier: 1, enableJitter: false },
      });

      const res = await failingService.ingestUsageEvent(
        {
          eventId: 'evt_fail',
          idempotencyKey: 'idem_fail',
          tenantId: 'tenant_dlq',
          dimension: 'NETWORK_EGRESS_GB',
          units: 500,
          timestamp: now,
        },
        now,
      );

      expect(res.accepted).toBe(false);
      expect(res.error).toBe('DATABASE_STORAGE_CRITICAL_FAILURE');
      expect(dlq.getRecordCount('tenant_dlq')).toBe(1);
      expect(dlq.getRecords('tenant_dlq')[0].failureReason).toBe('DATABASE_STORAGE_CRITICAL_FAILURE');
    });
  });
});
