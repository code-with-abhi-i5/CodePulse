import {
  DataRetentionReaperService,
  DataRetentionPolicy,
  RetentionTargetRecord,
  ExponentialBackoffExecutor,
  ReaperCircuitBreaker,
  InMemoryDeadLetterQueue,
  DefaultOpenTelemetryTracer,
  PrometheusMetricsRegistry,
  StructuredWinstonLogger,
  InMemoryStoragePurgeExecutor,
  CircuitBreakerOpenException,
  RetentionReapTimeoutException,
  CircuitState,
} from './data-retention-reaper.service';

describe('DataRetentionReaperService (Comprehensive Unit & Integration Test Suite)', () => {
  let service: DataRetentionReaperService;
  let storage: InMemoryStoragePurgeExecutor;
  let dlq: InMemoryDeadLetterQueue;
  let circuitBreaker: ReaperCircuitBreaker;
  let tracer: DefaultOpenTelemetryTracer;
  let metrics: PrometheusMetricsRegistry;
  let winstonLogger: StructuredWinstonLogger;
  let now: number;

  beforeEach(() => {
    storage = new InMemoryStoragePurgeExecutor();
    dlq = new InMemoryDeadLetterQueue();
    circuitBreaker = new ReaperCircuitBreaker({
      failureThreshold: 3,
      recoveryTimeoutMs: 500,
      halfOpenSuccessThreshold: 2,
    });
    tracer = new DefaultOpenTelemetryTracer();
    metrics = new PrometheusMetricsRegistry();
    winstonLogger = new StructuredWinstonLogger();

    service = new DataRetentionReaperService({
      storageExecutor: storage,
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
  // 1. Core Service Logic & Retention Calculation
  // ==========================================================================
  describe('Core Service Logic & Cutoff Evaluation', () => {
    it('correctly splits records into expired and retained based on retentionDays and gracePeriodHours', () => {
      const policy: DataRetentionPolicy = {
        dataset: 'telemetry_logs',
        retentionDays: 30,
        gracePeriodHours: 24,
        batchSize: 100,
        softDelete: false,
      };

      const cutoffTimestamp = now - 30 * 86400 * 1000 - 24 * 3600 * 1000;

      const records: RetentionTargetRecord[] = [
        { id: 'rec_expired_1', dataset: 'telemetry_logs', timestamp: cutoffTimestamp - 1000, sizeBytes: 1024 },
        { id: 'rec_expired_2', dataset: 'telemetry_logs', timestamp: cutoffTimestamp - 50000, sizeBytes: 2048 },
        { id: 'rec_retained_1', dataset: 'telemetry_logs', timestamp: cutoffTimestamp + 1000, sizeBytes: 512 },
        { id: 'rec_retained_2', dataset: 'telemetry_logs', timestamp: now - 1000, sizeBytes: 256 },
      ];

      const evaluation = service.evaluateRecords(records, policy, now);

      expect(evaluation.cutoffTimestamp).toBe(cutoffTimestamp);
      expect(evaluation.expired.length).toBe(2);
      expect(evaluation.expired.map((r) => r.id)).toEqual(['rec_expired_1', 'rec_expired_2']);
      expect(evaluation.retained.length).toBe(2);
      expect(evaluation.retained.map((r) => r.id)).toEqual(['rec_retained_1', 'rec_retained_2']);
    });

    it('handles zero expired records boundary condition (all records fresh)', async () => {
      const policy: DataRetentionPolicy = {
        dataset: 'ephemeral_sessions',
        retentionDays: 7,
        batchSize: 50,
      };
      service.registerPolicy(policy);

      const freshRecords: RetentionTargetRecord[] = [
        { id: 'sess_1', dataset: 'ephemeral_sessions', timestamp: now - 3600000, sizeBytes: 100 },
        { id: 'sess_2', dataset: 'ephemeral_sessions', timestamp: now - 7200000, sizeBytes: 200 },
      ];
      storage.seed('ephemeral_sessions', freshRecords);

      const result = await service.reapDataset('ephemeral_sessions', now);

      expect(result.status).toBe('SUCCESS');
      expect(result.scannedCount).toBe(0);
      expect(result.reapedCount).toBe(0);
      expect(result.bytesReclaimed).toBe(0);
      expect(storage.getRecords('ephemeral_sessions').length).toBe(2);
    });

    it('handles all expired records boundary condition', async () => {
      const policy: DataRetentionPolicy = {
        dataset: 'ephemeral_sessions',
        retentionDays: 1,
        batchSize: 50,
        softDelete: false,
      };
      service.registerPolicy(policy);

      const expiredRecords: RetentionTargetRecord[] = [
        { id: 'sess_old_1', dataset: 'ephemeral_sessions', timestamp: now - 3 * 86400000, sizeBytes: 300 },
        { id: 'sess_old_2', dataset: 'ephemeral_sessions', timestamp: now - 4 * 86400000, sizeBytes: 700 },
      ];
      storage.seed('ephemeral_sessions', expiredRecords);

      const result = await service.reapDataset('ephemeral_sessions', now);

      expect(result.status).toBe('SUCCESS');
      expect(result.scannedCount).toBe(2);
      expect(result.reapedCount).toBe(2);
      expect(result.bytesReclaimed).toBe(1000);
      expect(storage.getRecords('ephemeral_sessions').length).toBe(0);
    });

    it('supports soft-delete mode and pre-purge archiving', async () => {
      const policy: DataRetentionPolicy = {
        dataset: 'audit_trails',
        retentionDays: 90,
        batchSize: 100,
        softDelete: true,
        archiveBeforeDelete: true,
      };
      service.registerPolicy(policy);

      const expiredRecord: RetentionTargetRecord = {
        id: 'audit_1',
        dataset: 'audit_trails',
        timestamp: now - 100 * 86400000,
        sizeBytes: 1500,
        isArchived: false,
        isDeleted: false,
      };
      storage.seed('audit_trails', [expiredRecord]);

      const result = await service.reapDataset('audit_trails', now);

      expect(result.status).toBe('SUCCESS');
      expect(result.reapedCount).toBe(1);
      expect(result.archivedCount).toBe(1);
      expect(result.bytesReclaimed).toBe(1500);

      const stored = storage.getRecords('audit_trails');
      expect(stored.length).toBe(1);
      expect(stored[0].isArchived).toBe(true);
      expect(stored[0].isDeleted).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Resilience: Exponential Backoff Retry Policies
  // ==========================================================================
  describe('Resilience: Exponential Backoff Retries', () => {
    it('calculates deterministic exponential backoff delays with clamping', () => {
      const initial = 50;
      const max = 1000;
      const multiplier = 2.0;

      expect(ExponentialBackoffExecutor.calculateDelay(0, initial, max, multiplier, false)).toBe(50);
      expect(ExponentialBackoffExecutor.calculateDelay(1, initial, max, multiplier, false)).toBe(100);
      expect(ExponentialBackoffExecutor.calculateDelay(2, initial, max, multiplier, false)).toBe(200);
      expect(ExponentialBackoffExecutor.calculateDelay(3, initial, max, multiplier, false)).toBe(400);
      expect(ExponentialBackoffExecutor.calculateDelay(4, initial, max, multiplier, false)).toBe(800);
      expect(ExponentialBackoffExecutor.calculateDelay(5, initial, max, multiplier, false)).toBe(1000); // clamped
    });

    it('applies proportional jitter within bounds when enabled', () => {
      const fixedRandom = () => 0.5;
      const delay = ExponentialBackoffExecutor.calculateDelay(2, 50, 1000, 2.0, true, fixedRandom);
      expect(delay).toBe(100); // 200 * 0.5
    });

    it('recovers successfully on transient network timeouts during retry', async () => {
      let attempts = 0;
      const mockSleep = jest.fn().mockResolvedValue(undefined);

      const result = await ExponentialBackoffExecutor.executeWithRetry<string>(
        async (attempt: number) => {
          attempts++;
          if (attempt < 2) {
            throw new Error('ETIMEDOUT: Connection to secondary replica timed out');
          }
          return 'PURGE_COMPLETED';
        },
        {
          maxRetries: 3,
          initialBackoffMs: 20,
          maxBackoffMs: 200,
          backoffMultiplier: 2.0,
          enableJitter: false,
          isRetryable: (err) => err.message.includes('ETIMEDOUT'),
        },
        undefined,
        mockSleep,
      );

      expect(result).toBe('PURGE_COMPLETED');
      expect(attempts).toBe(3); // 0, 1, 2
      expect(mockSleep).toHaveBeenCalledTimes(2);
    });

    it('fails fast on non-retryable errors without executing retries', async () => {
      let attempts = 0;
      const mockSleep = jest.fn().mockResolvedValue(undefined);

      await expect(
        ExponentialBackoffExecutor.executeWithRetry<string>(
          async () => {
            attempts++;
            throw new Error('CORRUPTED_METADATA_FORMAT');
          },
          {
            maxRetries: 3,
            initialBackoffMs: 20,
            maxBackoffMs: 200,
            backoffMultiplier: 2.0,
            enableJitter: false,
            isRetryable: (err) => err.message.includes('ETIMEDOUT'),
          },
          undefined,
          mockSleep,
        ),
      ).rejects.toThrow('CORRUPTED_METADATA_FORMAT');

      expect(attempts).toBe(1);
      expect(mockSleep).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 3. Resilience: Circuit Breaking
  // ==========================================================================
  describe('Resilience: Circuit Breaker State Transitions', () => {
    it('starts in CLOSED state and trips to OPEN after consecutive failure threshold', async () => {
      const cb = new ReaperCircuitBreaker({
        failureThreshold: 2,
        recoveryTimeoutMs: 500,
        halfOpenSuccessThreshold: 1,
      });

      expect(cb.getState(1000)).toBe('CLOSED');

      // Failure 1
      await expect(cb.execute(async () => { throw new Error('DB Down 1'); }, 1000)).rejects.toThrow('DB Down 1');
      expect(cb.getState(1000)).toBe('CLOSED');

      // Failure 2 -> Trips to OPEN
      await expect(cb.execute(async () => { throw new Error('DB Down 2'); }, 1000)).rejects.toThrow('DB Down 2');
      expect(cb.getState(1000)).toBe('OPEN');

      // Fast rejection while OPEN
      await expect(cb.execute(async () => 'never executed', 1100)).rejects.toThrow(CircuitBreakerOpenException);
    });

    it('recovers from OPEN to HALF_OPEN after recovery timeout, then resets to CLOSED on probe success', async () => {
      const cb = new ReaperCircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 300,
        halfOpenSuccessThreshold: 2,
      });

      await expect(cb.execute(async () => { throw new Error('Fail'); }, 1000)).rejects.toThrow('Fail');
      expect(cb.getState(1000)).toBe('OPEN');

      // Before timeout
      expect(cb.getState(1200)).toBe('OPEN');

      // After timeout: transitions to HALF_OPEN
      expect(cb.getState(1350)).toBe('HALF_OPEN');

      // Probe 1 success in HALF_OPEN
      const probe1 = await cb.execute(async () => 'probe_1_ok', 1350);
      expect(probe1).toBe('probe_1_ok');
      expect(cb.getState(1350)).toBe('HALF_OPEN');

      // Probe 2 success in HALF_OPEN -> closes breaker
      const probe2 = await cb.execute(async () => 'probe_2_ok', 1350);
      expect(probe2).toBe('probe_2_ok');
      expect(cb.getState(1350)).toBe('CLOSED');
    });

    it('re-trips to OPEN immediately if probe fails during HALF_OPEN', async () => {
      const cb = new ReaperCircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 200,
        halfOpenSuccessThreshold: 2,
      });

      cb.trip(1000);
      expect(cb.getState(1250)).toBe('HALF_OPEN');

      // Probe fails in HALF_OPEN -> immediately trips back to OPEN
      await expect(cb.execute(async () => { throw new Error('Probe Failed'); }, 1250)).rejects.toThrow('Probe Failed');
      expect(cb.getState(1250)).toBe('OPEN');
    });
  });

  // ==========================================================================
  // 4. Resilience: Dead Letter Queue (DLQ)
  // ==========================================================================
  describe('Resilience: Dead Letter Queue (DLQ)', () => {
    it('captures failed records with diagnostics and replays successfully', async () => {
      const deadQueue = new InMemoryDeadLetterQueue();

      await deadQueue.enqueue({
        recordId: 'dlq_audit_err_1',
        dataset: 'audit_trails',
        payload: { target: 'audit_record_99' },
        failureReason: 'ECONNREFUSED: target storage unreachable',
        stackTrace: 'Error: ECONNREFUSED at StorageDriver.purge',
        attempts: 4,
        firstFailedAt: now - 5000,
        lastFailedAt: now,
        isRetryable: false,
      });

      expect(deadQueue.getRecordCount()).toBe(1);
      expect(deadQueue.getRecordCount('audit_trails')).toBe(1);
      expect(deadQueue.getRecordCount('other_dataset')).toBe(0);

      // Replay handler succeeds
      const processed = await deadQueue.replay('dlq_audit_err_1', async (record) => {
        expect(record.recordId).toBe('dlq_audit_err_1');
        return true;
      });

      expect(processed).toBe(true);
      expect(deadQueue.getRecordCount()).toBe(0);
    });

    it('retains record in DLQ if replay handler fails', async () => {
      const deadQueue = new InMemoryDeadLetterQueue();
      await deadQueue.enqueue({
        recordId: 'poison_pill',
        dataset: 'telemetry_logs',
        payload: {},
        failureReason: 'Fatal parsing failure',
        attempts: 1,
        firstFailedAt: now,
        lastFailedAt: now,
        isRetryable: false,
      });

      const processed = await deadQueue.replay('poison_pill', async () => false);
      expect(processed).toBe(false);
      expect(deadQueue.getRecordCount()).toBe(1);

      // Purge queue
      const purged = deadQueue.purge('telemetry_logs');
      expect(purged).toBe(1);
      expect(deadQueue.getRecordCount()).toBe(0);
    });
  });

  // ==========================================================================
  // 5. Telemetry & Observability (OpenTelemetry, Prometheus, Winston)
  // ==========================================================================
  describe('Telemetry & Observability Integration', () => {
    it('creates OpenTelemetry trace spans with contextual attributes and records errors', async () => {
      const policy: DataRetentionPolicy = {
        dataset: 'ephemeral_sessions',
        retentionDays: 1,
        batchSize: 50,
      };
      service.registerPolicy(policy);
      storage.seed('ephemeral_sessions', [
        { id: 'sess_1', dataset: 'ephemeral_sessions', timestamp: now - 3 * 86400000, sizeBytes: 500 },
      ]);

      await service.reapDataset('ephemeral_sessions', now);

      const span = tracer.getLastSpan();
      expect(span).toBeDefined();
      expect(span?.name).toBe('data-retention.dataset-batch');
      expect(span?.getAttribute('data_retention.dataset')).toBe('ephemeral_sessions');
      expect(span?.getAttribute('data_retention.reaped_count')).toBe(1);
      expect(span?.getAttribute('data_retention.bytes_reclaimed')).toBe(500);
      expect(span?.status.code).toBe('OK');
      expect(span?.ended).toBe(true);
    });

    it('exports standard compliant Prometheus metrics format', async () => {
      metrics.incrementReapedRecords('telemetry_logs', 42);
      metrics.incrementBytesReclaimed('telemetry_logs', 8192);
      metrics.incrementErrors('telemetry_logs', 'ETIMEDOUT');
      metrics.incrementDlqRecords('telemetry_logs', 1);
      metrics.setCircuitBreakerState('telemetry_logs', 'CLOSED');
      metrics.observeCycleDuration('telemetry_logs', 0.125);

      const prometheusOutput = metrics.exportMetrics();

      expect(prometheusOutput).toContain('# HELP codepulse_data_retention_reaped_records_total');
      expect(prometheusOutput).toContain('# TYPE codepulse_data_retention_reaped_records_total counter');
      expect(prometheusOutput).toContain('codepulse_data_retention_reaped_records_total{dataset="telemetry_logs"} 42');
      expect(prometheusOutput).toContain('codepulse_data_retention_bytes_reclaimed_total{dataset="telemetry_logs"} 8192');
      expect(prometheusOutput).toContain('codepulse_data_retention_reap_errors_total{dataset="telemetry_logs",error_type="ETIMEDOUT"} 1');
      expect(prometheusOutput).toContain('codepulse_data_retention_dlq_records_total{dataset="telemetry_logs"} 1');
      expect(prometheusOutput).toContain('codepulse_data_retention_circuit_breaker_state{dataset="telemetry_logs",state="CLOSED"} 0');
      expect(prometheusOutput).toContain('codepulse_data_retention_cycle_duration_seconds{dataset="telemetry_logs"} 0.125');
    });

    it('emits structured Winston log events across the complete reap lifecycle', async () => {
      const policy: DataRetentionPolicy = {
        dataset: 'telemetry_logs',
        retentionDays: 1,
        batchSize: 50,
      };
      service.registerPolicy(policy);
      storage.seed('telemetry_logs', [
        { id: 't1', dataset: 'telemetry_logs', timestamp: now - 5 * 86400000, sizeBytes: 256 },
      ]);

      await service.executeReapCycle(now);

      const events = winstonLogger.events;
      expect(events.some((e) => e.event === 'REAP_CYCLE_STARTED')).toBe(true);
      expect(events.some((e) => e.event === 'BATCH_REAP_SUCCESS')).toBe(true);
      expect(events.some((e) => e.event === 'REAP_CYCLE_COMPLETED')).toBe(true);
    });
  });

  // ==========================================================================
  // 6. End-to-End Multi-Dataset Cycle & Error Edge Cases
  // ==========================================================================
  describe('End-to-End Cycle & Failure Modes', () => {
    it('executes multi-dataset cycle and aggregates report metrics', async () => {
      storage.seed('telemetry_logs', [
        { id: 't_old', dataset: 'telemetry_logs', timestamp: now - 35 * 86400000, sizeBytes: 100 },
      ]);
      storage.seed('ephemeral_sessions', [
        { id: 'e_old', dataset: 'ephemeral_sessions', timestamp: now - 10 * 86400000, sizeBytes: 200 },
      ]);

      const report = await service.executeReapCycle(now);

      expect(report.totalRecordsReaped).toBe(2);
      expect(report.totalBytesReclaimed).toBe(300);
      expect(report.batchResults.length).toBe(3); // default policies: telemetry_logs, ephemeral_sessions, audit_trails
      expect(report.circuitState).toBe('CLOSED');
    });

    it('handles circuit breaker open rejection gracefully during dataset batch', async () => {
      circuitBreaker.trip(now);

      const result = await service.reapDataset('telemetry_logs', now);

      expect(result.status).toBe('CIRCUIT_OPEN');
      expect(result.error).toBe('Circuit breaker is OPEN');
      expect(result.reapedCount).toBe(0);
    });

    it('handles storage failure by routing failed batch info to DLQ', async () => {
      const failingStorage: InMemoryStoragePurgeExecutor = {
        ...storage,
        fetchExpiredRecords: jest.fn().mockRejectedValue(new Error('FATAL_DATABASE_IO_ERROR')),
      } as unknown as InMemoryStoragePurgeExecutor;

      const failingService = new DataRetentionReaperService({
        storageExecutor: failingStorage,
        dlq,
        circuitBreaker,
        tracer,
        metrics,
        winstonLogger,
        retryPolicy: { maxRetries: 0, initialBackoffMs: 10, maxBackoffMs: 20, backoffMultiplier: 1, enableJitter: false },
      });

      const result = await failingService.reapDataset('telemetry_logs', now);

      expect(result.status).toBe('FAILED');
      expect(result.dlqForwardedCount).toBe(1);
      expect(dlq.getRecordCount('telemetry_logs')).toBe(1);
      expect(dlq.getRecords('telemetry_logs')[0].failureReason).toBe('FATAL_DATABASE_IO_ERROR');
    });
  });
});
