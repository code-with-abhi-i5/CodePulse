import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Core Types & Modular Interfaces (Strict TypeScript 5.9, Zero 'any')
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ReapBatchStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CIRCUIT_OPEN';

export interface DataRetentionPolicy {
  readonly dataset: string;
  readonly retentionDays: number;
  readonly batchSize: number;
  readonly gracePeriodHours?: number;
  readonly softDelete?: boolean;
  readonly archiveBeforeDelete?: boolean;
  readonly maxPurgeLimit?: number;
}

export interface RetentionTargetRecord {
  readonly id: string;
  readonly dataset: string;
  readonly timestamp: number;
  readonly sizeBytes: number;
  readonly isArchived?: boolean;
  readonly isDeleted?: boolean;
  readonly tenantId?: string;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface ReapBatchResult {
  readonly dataset: string;
  readonly scannedCount: number;
  readonly reapedCount: number;
  readonly archivedCount: number;
  readonly bytesReclaimed: number;
  readonly dlqForwardedCount: number;
  readonly durationMs: number;
  readonly status: ReapBatchStatus;
  readonly error?: string;
}

export interface ReapCycleReport {
  readonly cycleId: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly totalDatasetsProcessed: number;
  readonly totalRecordsScanned: number;
  readonly totalRecordsReaped: number;
  readonly totalRecordsArchived: number;
  readonly totalBytesReclaimed: number;
  readonly totalDlqForwarded: number;
  readonly batchResults: ReadonlyArray<ReapBatchResult>;
  readonly circuitState: CircuitState;
}

export interface RetryPolicyConfig {
  readonly maxRetries: number;
  readonly initialBackoffMs: number;
  readonly maxBackoffMs: number;
  readonly backoffMultiplier: number;
  readonly enableJitter: boolean;
  readonly isRetryable?: (error: Error) => boolean;
}

export interface CircuitBreakerConfig {
  readonly failureThreshold: number;
  readonly recoveryTimeoutMs: number;
  readonly halfOpenSuccessThreshold: number;
}

export interface DeadLetterQueueRecord<T = unknown> {
  readonly recordId: string;
  readonly dataset: string;
  readonly payload: T;
  readonly failureReason: string;
  readonly stackTrace?: string;
  readonly attempts: number;
  readonly firstFailedAt: number;
  readonly lastFailedAt: number;
  readonly isRetryable: boolean;
}

export interface IDeadLetterQueue {
  enqueue(record: DeadLetterQueueRecord<unknown>): Promise<void>;
  getRecords(dataset?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>>;
  getRecordCount(dataset?: string): number;
  replay(recordId: string, processor: (record: DeadLetterQueueRecord<unknown>) => Promise<boolean>): Promise<boolean>;
  purge(dataset?: string): number;
}

export interface IOpenTelemetrySpan {
  setAttribute(key: string, value: string | number | boolean): void;
  recordException(error: Error): void;
  setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void;
  end(): void;
}

export interface IOpenTelemetryTracer {
  startSpan(name: string, attributes?: Readonly<Record<string, string | number | boolean>>): IOpenTelemetrySpan;
}

export interface IPrometheusMetricsCollector {
  incrementReapedRecords(dataset: string, count: number): void;
  incrementBytesReclaimed(dataset: string, bytes: number): void;
  incrementErrors(dataset: string, errorType: string): void;
  incrementDlqRecords(dataset: string, count: number): void;
  setCircuitBreakerState(dataset: string, state: CircuitState): void;
  observeCycleDuration(dataset: string, durationSeconds: number): void;
  exportMetrics(): string;
}

export type WinstonLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface WinstonLogEvent {
  readonly event:
    | 'REAP_CYCLE_STARTED'
    | 'BATCH_REAP_SUCCESS'
    | 'BATCH_REAP_PARTIAL'
    | 'BATCH_REAP_FAILED'
    | 'RETRY_ATTEMPT'
    | 'CIRCUIT_BREAKER_TRIPPED'
    | 'CIRCUIT_BREAKER_HALF_OPEN'
    | 'CIRCUIT_BREAKER_RESET'
    | 'CIRCUIT_BREAKER_REJECTED'
    | 'DLQ_FORWARDED'
    | 'REAP_CYCLE_COMPLETED';
  readonly message: string;
  readonly timestamp: number;
  readonly [key: string]: unknown;
}

export interface IWinstonLogger {
  log(level: WinstonLogLevel, event: WinstonLogEvent): void;
  info(event: WinstonLogEvent): void;
  warn(event: WinstonLogEvent): void;
  error(event: WinstonLogEvent): void;
  debug(event: WinstonLogEvent): void;
}

export interface IStoragePurgeExecutor {
  fetchExpiredRecords(
    dataset: string,
    cutoffTimestamp: number,
    limit: number,
  ): Promise<ReadonlyArray<RetentionTargetRecord>>;
  archiveRecords(records: ReadonlyArray<RetentionTargetRecord>): Promise<number>;
  deleteRecords(records: ReadonlyArray<RetentionTargetRecord>, softDelete: boolean): Promise<number>;
}

// ============================================================================
// Custom Exceptions
// ============================================================================

export class CircuitBreakerOpenException extends Error {
  constructor(message: string = 'CircuitBreaker: Circuit is OPEN, rejecting execution') {
    super(message);
    this.name = 'CircuitBreakerOpenException';
    Object.setPrototypeOf(this, CircuitBreakerOpenException.prototype);
  }
}

export class RetentionReapTimeoutException extends Error {
  constructor(message: string = 'RetentionReap: Operation timed out') {
    super(message);
    this.name = 'RetentionReapTimeoutException';
    Object.setPrototypeOf(this, RetentionReapTimeoutException.prototype);
  }
}

// ============================================================================
// Resilience: Exponential Backoff Retry Policy
// ============================================================================

export class ExponentialBackoffExecutor {
  public static calculateDelay(
    attempt: number,
    initialBackoffMs: number,
    maxBackoffMs: number,
    multiplier: number,
    enableJitter: boolean,
    randomFn: () => number = Math.random,
  ): number {
    const rawDelay = Math.min(maxBackoffMs, initialBackoffMs * Math.pow(multiplier, attempt));
    if (!enableJitter) {
      return Math.round(rawDelay);
    }
    // Full jitter algorithm: random delay between 0 and rawDelay
    return Math.round(randomFn() * rawDelay);
  }

  public static async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    policy: RetryPolicyConfig,
    onRetry?: (error: Error, attempt: number, delayMs: number) => void,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ): Promise<T> {
    let lastError: Error = new Error('Unknown retry failure');

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await operation(attempt);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt >= policy.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (policy.isRetryable && !policy.isRetryable(lastError)) {
          throw lastError;
        }

        const delay = this.calculateDelay(
          attempt,
          policy.initialBackoffMs,
          policy.maxBackoffMs,
          policy.backoffMultiplier,
          policy.enableJitter,
        );

        if (onRetry) {
          onRetry(lastError, attempt + 1, delay);
        }

        if (delay > 0) {
          await sleepFn(delay);
        }
      }
    }

    throw lastError;
  }
}

// ============================================================================
// Resilience: Circuit Breaker
// ============================================================================

export class ReaperCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime = 0;

  constructor(private readonly config: CircuitBreakerConfig = {
    failureThreshold: 3,
    recoveryTimeoutMs: 5000,
    halfOpenSuccessThreshold: 2,
  }) {}

  public getState(now: number = Date.now()): CircuitState {
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime >= this.config.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
      }
    }
    return this.state;
  }

  public async execute<T>(action: () => Promise<T>, now: number = Date.now()): Promise<T> {
    const currentState = this.getState(now);

    if (currentState === 'OPEN') {
      throw new CircuitBreakerOpenException(
        `ReaperCircuitBreaker is OPEN (tripped at ${new Date(this.lastFailureTime).toISOString()})`,
      );
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err: unknown) {
      this.recordFailure(now);
      throw err;
    }
  }

  public recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.config.halfOpenSuccessThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      this.consecutiveFailures = 0;
    }
  }

  public recordFailure(now: number = Date.now()): void {
    this.lastFailureTime = now;
    if (this.state === 'HALF_OPEN') {
      // Immediate trip back to OPEN if probe fails in HALF_OPEN
      this.state = 'OPEN';
      this.consecutiveSuccesses = 0;
    } else if (this.state === 'CLOSED') {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.config.failureThreshold) {
        this.state = 'OPEN';
      }
    }
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = 0;
  }

  public trip(now: number = Date.now()): void {
    this.state = 'OPEN';
    this.lastFailureTime = now;
  }
}

// ============================================================================
// Resilience: Dead Letter Queue (DLQ)
// ============================================================================

export class InMemoryDeadLetterQueue implements IDeadLetterQueue {
  private readonly records: Map<string, DeadLetterQueueRecord<unknown>> = new Map();

  public async enqueue(record: DeadLetterQueueRecord<unknown>): Promise<void> {
    this.records.set(record.recordId, record);
  }

  public getRecords(dataset?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>> {
    const list = Array.from(this.records.values());
    if (!dataset) {
      return list;
    }
    return list.filter((r) => r.dataset === dataset);
  }

  public getRecordCount(dataset?: string): number {
    return this.getRecords(dataset).length;
  }

  public async replay(
    recordId: string,
    processor: (record: DeadLetterQueueRecord<unknown>) => Promise<boolean>,
  ): Promise<boolean> {
    const record = this.records.get(recordId);
    if (!record) {
      return false;
    }
    const success = await processor(record);
    if (success) {
      this.records.delete(recordId);
      return true;
    }
    return false;
  }

  public purge(dataset?: string): number {
    if (!dataset) {
      const count = this.records.size;
      this.records.clear();
      return count;
    }
    let purged = 0;
    for (const [id, rec] of this.records.entries()) {
      if (rec.dataset === dataset) {
        this.records.delete(id);
        purged++;
      }
    }
    return purged;
  }
}

// ============================================================================
// Telemetry & Observability Implementations
// ============================================================================

export class DefaultOpenTelemetrySpan implements IOpenTelemetrySpan {
  private readonly attributes: Map<string, string | number | boolean> = new Map();
  public exception?: Error;
  public status: { code: 'OK' | 'ERROR'; message?: string } = { code: 'OK' };
  public ended = false;
  public endTime?: number;

  constructor(public readonly name: string, public readonly startTime: number = Date.now()) {}

  public setAttribute(key: string, value: string | number | boolean): void {
    this.attributes.set(key, value);
  }

  public getAttribute(key: string): string | number | boolean | undefined {
    return this.attributes.get(key);
  }

  public getAttributes(): ReadonlyMap<string, string | number | boolean> {
    return this.attributes;
  }

  public recordException(error: Error): void {
    this.exception = error;
  }

  public setStatus(status: { code: 'OK' | 'ERROR'; message?: string }): void {
    this.status = status;
  }

  public end(): void {
    this.ended = true;
    this.endTime = Date.now();
  }
}

export class DefaultOpenTelemetryTracer implements IOpenTelemetryTracer {
  public readonly spans: DefaultOpenTelemetrySpan[] = [];

  public startSpan(
    name: string,
    attributes?: Readonly<Record<string, string | number | boolean>>,
  ): DefaultOpenTelemetrySpan {
    const span = new DefaultOpenTelemetrySpan(name);
    if (attributes) {
      for (const [k, v] of Object.entries(attributes)) {
        span.setAttribute(k, v);
      }
    }
    this.spans.push(span);
    return span;
  }

  public getLastSpan(): DefaultOpenTelemetrySpan | undefined {
    return this.spans[this.spans.length - 1];
  }

  public clear(): void {
    this.spans.length = 0;
  }
}

export class PrometheusMetricsRegistry implements IPrometheusMetricsCollector {
  private readonly reapedRecords: Map<string, number> = new Map();
  private readonly bytesReclaimed: Map<string, number> = new Map();
  private readonly errors: Map<string, Map<string, number>> = new Map();
  private readonly dlqRecords: Map<string, number> = new Map();
  private readonly circuitStates: Map<string, CircuitState> = new Map();
  private readonly cycleDurations: Map<string, number> = new Map();

  public incrementReapedRecords(dataset: string, count: number): void {
    this.reapedRecords.set(dataset, (this.reapedRecords.get(dataset) || 0) + count);
  }

  public incrementBytesReclaimed(dataset: string, bytes: number): void {
    this.bytesReclaimed.set(dataset, (this.bytesReclaimed.get(dataset) || 0) + bytes);
  }

  public incrementErrors(dataset: string, errorType: string): void {
    let errMap = this.errors.get(dataset);
    if (!errMap) {
      errMap = new Map();
      this.errors.set(dataset, errMap);
    }
    errMap.set(errorType, (errMap.get(errorType) || 0) + 1);
  }

  public incrementDlqRecords(dataset: string, count: number): void {
    this.dlqRecords.set(dataset, (this.dlqRecords.get(dataset) || 0) + count);
  }

  public setCircuitBreakerState(dataset: string, state: CircuitState): void {
    this.circuitStates.set(dataset, state);
  }

  public observeCycleDuration(dataset: string, durationSeconds: number): void {
    this.cycleDurations.set(dataset, Number(durationSeconds.toFixed(4)));
  }

  public getReapedCount(dataset: string): number {
    return this.reapedRecords.get(dataset) || 0;
  }

  public getBytesReclaimed(dataset: string): number {
    return this.bytesReclaimed.get(dataset) || 0;
  }

  public getErrorCount(dataset: string, errorType: string): number {
    return this.errors.get(dataset)?.get(errorType) || 0;
  }

  public getDlqCount(dataset: string): number {
    return this.dlqRecords.get(dataset) || 0;
  }

  public exportMetrics(): string {
    const lines: string[] = [
      '# HELP codepulse_data_retention_reaped_records_total Total number of expired records pruned per dataset',
      '# TYPE codepulse_data_retention_reaped_records_total counter',
    ];
    for (const [ds, count] of this.reapedRecords) {
      lines.push(`codepulse_data_retention_reaped_records_total{dataset="${ds}"} ${count}`);
    }

    lines.push(
      '# HELP codepulse_data_retention_bytes_reclaimed_total Total bytes reclaimed by purging expired data',
      '# TYPE codepulse_data_retention_bytes_reclaimed_total counter',
    );
    for (const [ds, bytes] of this.bytesReclaimed) {
      lines.push(`codepulse_data_retention_bytes_reclaimed_total{dataset="${ds}"} ${bytes}`);
    }

    lines.push(
      '# HELP codepulse_data_retention_reap_errors_total Total errors encountered during retention purge cycles',
      '# TYPE codepulse_data_retention_reap_errors_total counter',
    );
    for (const [ds, errMap] of this.errors) {
      for (const [errType, count] of errMap) {
        lines.push(`codepulse_data_retention_reap_errors_total{dataset="${ds}",error_type="${errType}"} ${count}`);
      }
    }

    lines.push(
      '# HELP codepulse_data_retention_dlq_records_total Total poisoned or exhausted records sent to dead letter queue',
      '# TYPE codepulse_data_retention_dlq_records_total counter',
    );
    for (const [ds, count] of this.dlqRecords) {
      lines.push(`codepulse_data_retention_dlq_records_total{dataset="${ds}"} ${count}`);
    }

    lines.push(
      '# HELP codepulse_data_retention_circuit_breaker_state Current circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
      '# TYPE codepulse_data_retention_circuit_breaker_state gauge',
    );
    for (const [ds, state] of this.circuitStates) {
      const code = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2;
      lines.push(`codepulse_data_retention_circuit_breaker_state{dataset="${ds}",state="${state}"} ${code}`);
    }

    lines.push(
      '# HELP codepulse_data_retention_cycle_duration_seconds Duration in seconds of the most recent retention reap cycle',
      '# TYPE codepulse_data_retention_cycle_duration_seconds gauge',
    );
    for (const [ds, sec] of this.cycleDurations) {
      lines.push(`codepulse_data_retention_cycle_duration_seconds{dataset="${ds}"} ${sec}`);
    }

    return lines.join('\n') + '\n';
  }
}

export class StructuredWinstonLogger implements IWinstonLogger {
  public readonly events: WinstonLogEvent[] = [];

  constructor(private readonly fallbackNestLogger?: Logger) {}

  public log(level: WinstonLogLevel, event: WinstonLogEvent): void {
    this.events.push(event);
    const jsonStr = JSON.stringify(event);
    if (this.fallbackNestLogger) {
      if (level === 'error') {
        this.fallbackNestLogger.error(jsonStr);
      } else if (level === 'warn') {
        this.fallbackNestLogger.warn(jsonStr);
      } else if (level === 'debug') {
        this.fallbackNestLogger.debug(jsonStr);
      } else {
        this.fallbackNestLogger.log(jsonStr);
      }
    }
  }

  public info(event: WinstonLogEvent): void {
    this.log('info', event);
  }

  public warn(event: WinstonLogEvent): void {
    this.log('warn', event);
  }

  public error(event: WinstonLogEvent): void {
    this.log('error', event);
  }

  public debug(event: WinstonLogEvent): void {
    this.log('debug', event);
  }

  public getLastEvent(): WinstonLogEvent | undefined {
    return this.events[this.events.length - 1];
  }

  public clear(): void {
    this.events.length = 0;
  }
}

// ============================================================================
// Default In-Memory Storage Purge Executor
// ============================================================================

export class InMemoryStoragePurgeExecutor implements IStoragePurgeExecutor {
  private readonly store: Map<string, RetentionTargetRecord[]> = new Map();

  public seed(dataset: string, records: ReadonlyArray<RetentionTargetRecord>): void {
    this.store.set(dataset, [...records]);
  }

  public getRecords(dataset: string): ReadonlyArray<RetentionTargetRecord> {
    return this.store.get(dataset) || [];
  }

  public async fetchExpiredRecords(
    dataset: string,
    cutoffTimestamp: number,
    limit: number,
  ): Promise<ReadonlyArray<RetentionTargetRecord>> {
    const list = this.store.get(dataset) || [];
    const matched = list.filter((r) => r.timestamp < cutoffTimestamp && !r.isDeleted);
    return matched.slice(0, limit);
  }

  public async archiveRecords(records: ReadonlyArray<RetentionTargetRecord>): Promise<number> {
    let archived = 0;
    for (const r of records) {
      const list = this.store.get(r.dataset);
      if (list) {
        const idx = list.findIndex((x) => x.id === r.id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], isArchived: true };
          archived++;
        }
      }
    }
    return archived;
  }

  public async deleteRecords(
    records: ReadonlyArray<RetentionTargetRecord>,
    softDelete: boolean,
  ): Promise<number> {
    let deleted = 0;
    for (const r of records) {
      const list = this.store.get(r.dataset);
      if (list) {
        const idx = list.findIndex((x) => x.id === r.id);
        if (idx !== -1) {
          if (softDelete) {
            list[idx] = { ...list[idx], isDeleted: true };
          } else {
            list.splice(idx, 1);
          }
          deleted++;
        }
      }
    }
    return deleted;
  }
}

// ============================================================================
// Main Service: DataRetentionReaperService
// ============================================================================

@Injectable()
export class DataRetentionReaperService {
  private readonly nestLogger = new Logger(DataRetentionReaperService.name);
  private readonly policies: Map<string, DataRetentionPolicy> = new Map();

  public readonly retryPolicy: RetryPolicyConfig;
  public readonly circuitBreaker: ReaperCircuitBreaker;
  public readonly dlq: IDeadLetterQueue;
  public readonly tracer: IOpenTelemetryTracer;
  public readonly metrics: IPrometheusMetricsCollector;
  public readonly winstonLogger: IWinstonLogger;
  public readonly storageExecutor: IStoragePurgeExecutor;

  constructor(options?: {
    storageExecutor?: IStoragePurgeExecutor;
    dlq?: IDeadLetterQueue;
    circuitBreaker?: ReaperCircuitBreaker;
    tracer?: IOpenTelemetryTracer;
    metrics?: IPrometheusMetricsCollector;
    winstonLogger?: IWinstonLogger;
    retryPolicy?: Partial<RetryPolicyConfig>;
  }) {
    this.storageExecutor = options?.storageExecutor ?? new InMemoryStoragePurgeExecutor();
    this.dlq = options?.dlq ?? new InMemoryDeadLetterQueue();
    this.circuitBreaker = options?.circuitBreaker ?? new ReaperCircuitBreaker();
    this.tracer = options?.tracer ?? new DefaultOpenTelemetryTracer();
    this.metrics = options?.metrics ?? new PrometheusMetricsRegistry();
    this.winstonLogger = options?.winstonLogger ?? new StructuredWinstonLogger(this.nestLogger);

    this.retryPolicy = {
      maxRetries: options?.retryPolicy?.maxRetries ?? 3,
      initialBackoffMs: options?.retryPolicy?.initialBackoffMs ?? 50,
      maxBackoffMs: options?.retryPolicy?.maxBackoffMs ?? 2000,
      backoffMultiplier: options?.retryPolicy?.backoffMultiplier ?? 2.0,
      enableJitter: options?.retryPolicy?.enableJitter ?? false,
      isRetryable: options?.retryPolicy?.isRetryable ?? ((err: Error) => {
        const msg = err.message.toLowerCase();
        // Network, timeout, connection, and transient 5xx errors are retryable
        return (
          msg.includes('timeout') ||
          msg.includes('econnreset') ||
          msg.includes('network') ||
          msg.includes('transient') ||
          msg.includes('econnrefused')
        );
      }),
    };

    // Register baseline standard retention policies for CodePulse datasets
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies(): void {
    this.registerPolicy({
      dataset: 'telemetry_logs',
      retentionDays: 30,
      batchSize: 500,
      gracePeriodHours: 24,
      softDelete: false,
      archiveBeforeDelete: false,
    });
    this.registerPolicy({
      dataset: 'ephemeral_sessions',
      retentionDays: 7,
      batchSize: 200,
      gracePeriodHours: 0,
      softDelete: false,
      archiveBeforeDelete: false,
    });
    this.registerPolicy({
      dataset: 'audit_trails',
      retentionDays: 365,
      batchSize: 100,
      gracePeriodHours: 48,
      softDelete: true,
      archiveBeforeDelete: true,
    });
  }

  public registerPolicy(policy: DataRetentionPolicy): void {
    this.policies.set(policy.dataset, policy);
  }

  public getPolicy(dataset: string): DataRetentionPolicy | undefined {
    return this.policies.get(dataset);
  }

  public getPolicies(): ReadonlyArray<DataRetentionPolicy> {
    return Array.from(this.policies.values());
  }

  /**
   * Evaluates records against retention policy cutoff, accounting for retentionDays and gracePeriodHours.
   */
  public evaluateRecords(
    records: ReadonlyArray<RetentionTargetRecord>,
    policy: DataRetentionPolicy,
    now: number = Date.now(),
  ): {
    expired: ReadonlyArray<RetentionTargetRecord>;
    retained: ReadonlyArray<RetentionTargetRecord>;
    cutoffTimestamp: number;
  } {
    const graceMs = (policy.gracePeriodHours || 0) * 3600 * 1000;
    const retentionMs = policy.retentionDays * 86400 * 1000;
    const cutoffTimestamp = now - retentionMs - graceMs;

    const expired: RetentionTargetRecord[] = [];
    const retained: RetentionTargetRecord[] = [];

    for (const record of records) {
      if (record.timestamp < cutoffTimestamp) {
        expired.push(record);
      } else {
        retained.push(record);
      }
    }

    return { expired, retained, cutoffTimestamp };
  }

  /**
   * Executes a full data retention reap cycle across all registered datasets.
   */
  public async executeReapCycle(now: number = Date.now()): Promise<ReapCycleReport> {
    const cycleId = `cycle_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const span = this.tracer.startSpan('data-retention.reap-cycle', {
      'data_retention.cycle_id': cycleId,
      'data_retention.policies_count': this.policies.size,
    });

    this.winstonLogger.info({
      event: 'REAP_CYCLE_STARTED',
      message: `Starting data retention reap cycle ${cycleId} across ${this.policies.size} datasets`,
      timestamp: now,
      cycleId,
      policiesCount: this.policies.size,
    });

    const batchResults: ReapBatchResult[] = [];
    let totalScanned = 0;
    let totalReaped = 0;
    let totalArchived = 0;
    let totalBytesReclaimed = 0;
    let totalDlq = 0;

    try {
      for (const policy of this.policies.values()) {
        const batchResult = await this.reapDataset(policy.dataset, now);
        batchResults.push(batchResult);

        totalScanned += batchResult.scannedCount;
        totalReaped += batchResult.reapedCount;
        totalArchived += batchResult.archivedCount;
        totalBytesReclaimed += batchResult.bytesReclaimed;
        totalDlq += batchResult.dlqForwardedCount;
      }

      const completedAt = Date.now();
      const durationMs = completedAt - now;

      span.setAttribute('data_retention.total_reaped', totalReaped);
      span.setAttribute('data_retention.bytes_reclaimed', totalBytesReclaimed);
      span.setAttribute('data_retention.duration_ms', durationMs);
      span.setStatus({ code: 'OK' });
      span.end();

      const report: ReapCycleReport = {
        cycleId,
        startedAt: now,
        completedAt,
        durationMs,
        totalDatasetsProcessed: this.policies.size,
        totalRecordsScanned: totalScanned,
        totalRecordsReaped: totalReaped,
        totalRecordsArchived: totalArchived,
        totalBytesReclaimed,
        totalDlqForwarded: totalDlq,
        batchResults,
        circuitState: this.circuitBreaker.getState(completedAt),
      };

      this.winstonLogger.info({
        event: 'REAP_CYCLE_COMPLETED',
        message: `Completed reap cycle ${cycleId}: reaped ${totalReaped} records, reclaimed ${totalBytesReclaimed} bytes`,
        timestamp: completedAt,
        cycleId,
        durationMs,
        totalReaped,
        totalBytesReclaimed,
      });

      return report;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error.message });
      span.end();

      this.winstonLogger.error({
        event: 'BATCH_REAP_FAILED',
        message: `Reap cycle ${cycleId} encountered fatal failure: ${error.message}`,
        timestamp: Date.now(),
        cycleId,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Reaps expired records for a single dataset with circuit breaking, retries, and DLQ fallback.
   */
  public async reapDataset(dataset: string, now: number = Date.now()): Promise<ReapBatchResult> {
    const policy = this.policies.get(dataset);
    if (!policy) {
      throw new Error(`DataRetentionPolicy not found for dataset: ${dataset}`);
    }

    const startTime = Date.now();
    const datasetSpan = this.tracer.startSpan('data-retention.dataset-batch', {
      'data_retention.dataset': dataset,
      'data_retention.retention_days': policy.retentionDays,
    });

    const currentCircuitState = this.circuitBreaker.getState(now);
    this.metrics.setCircuitBreakerState(dataset, currentCircuitState);

    // Fast-path rejection when Circuit is OPEN
    if (currentCircuitState === 'OPEN') {
      datasetSpan.setAttribute('data_retention.circuit_rejection', true);
      datasetSpan.setStatus({ code: 'ERROR', message: 'Circuit breaker is OPEN' });
      datasetSpan.end();

      this.winstonLogger.warn({
        event: 'CIRCUIT_BREAKER_REJECTED',
        message: `Reap execution rejected for dataset ${dataset}: Circuit is OPEN`,
        timestamp: startTime,
        dataset,
      });

      return {
        dataset,
        scannedCount: 0,
        reapedCount: 0,
        archivedCount: 0,
        bytesReclaimed: 0,
        dlqForwardedCount: 0,
        durationMs: Date.now() - startTime,
        status: 'CIRCUIT_OPEN',
        error: 'Circuit breaker is OPEN',
      };
    }

    const graceMs = (policy.gracePeriodHours || 0) * 3600 * 1000;
    const retentionMs = policy.retentionDays * 86400 * 1000;
    const cutoffTimestamp = now - retentionMs - graceMs;

    try {
      // Execute with Circuit Breaker and Exponential Backoff Retries
      const batchResult = await this.circuitBreaker.execute(async () => {
        return await ExponentialBackoffExecutor.executeWithRetry<ReapBatchResult>(
          async (attempt: number) => {
            return await this.executeStoragePurge(policy, cutoffTimestamp, attempt);
          },
          this.retryPolicy,
          (retryError: Error, attempt: number, delayMs: number) => {
            this.metrics.incrementErrors(dataset, 'RETRY_TRANSIENT');
            this.winstonLogger.warn({
              event: 'RETRY_ATTEMPT',
              message: `Retrying dataset ${dataset} (attempt ${attempt}) after ${delayMs}ms: ${retryError.message}`,
              timestamp: Date.now(),
              dataset,
              attempt,
              delayMs,
              error: retryError.message,
            });
          },
        );
      }, now);

      const durationMs = Date.now() - startTime;
      const durationSeconds = durationMs / 1000;

      // Update Prometheus metrics
      this.metrics.incrementReapedRecords(dataset, batchResult.reapedCount);
      this.metrics.incrementBytesReclaimed(dataset, batchResult.bytesReclaimed);
      this.metrics.observeCycleDuration(dataset, durationSeconds);
      this.metrics.setCircuitBreakerState(dataset, this.circuitBreaker.getState());

      datasetSpan.setAttribute('data_retention.reaped_count', batchResult.reapedCount);
      datasetSpan.setAttribute('data_retention.bytes_reclaimed', batchResult.bytesReclaimed);
      datasetSpan.setStatus({ code: 'OK' });
      datasetSpan.end();

      this.winstonLogger.info({
        event: 'BATCH_REAP_SUCCESS',
        message: `Successfully reaped ${batchResult.reapedCount} records (${batchResult.bytesReclaimed} bytes) for ${dataset}`,
        timestamp: Date.now(),
        dataset,
        reapedCount: batchResult.reapedCount,
        bytesReclaimed: batchResult.bytesReclaimed,
        durationMs,
      });

      return {
        ...batchResult,
        durationMs,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const durationMs = Date.now() - startTime;

      this.metrics.incrementErrors(dataset, error.name || 'UNKNOWN_ERROR');
      this.metrics.setCircuitBreakerState(dataset, this.circuitBreaker.getState());

      datasetSpan.recordException(error);
      datasetSpan.setStatus({ code: 'ERROR', message: error.message });
      datasetSpan.end();

      // Dead Letter Queue Fallback: Forward problematic batch metadata to DLQ
      const dlqRecord: DeadLetterQueueRecord<{ dataset: string; cutoffTimestamp: number }> = {
        recordId: `dlq_${dataset}_${startTime}`,
        dataset,
        payload: { dataset, cutoffTimestamp },
        failureReason: error.message,
        stackTrace: error.stack,
        attempts: this.retryPolicy.maxRetries + 1,
        firstFailedAt: startTime,
        lastFailedAt: Date.now(),
        isRetryable: false,
      };

      await this.dlq.enqueue(dlqRecord);
      this.metrics.incrementDlqRecords(dataset, 1);

      this.winstonLogger.error({
        event: 'DLQ_FORWARDED',
        message: `Forwarded failed batch for ${dataset} to DLQ: ${error.message}`,
        timestamp: Date.now(),
        dataset,
        error: error.message,
      });

      return {
        dataset,
        scannedCount: 0,
        reapedCount: 0,
        archivedCount: 0,
        bytesReclaimed: 0,
        dlqForwardedCount: 1,
        durationMs,
        status: 'FAILED',
        error: error.message,
      };
    }
  }

  /**
   * Internal storage purge execution logic handling archiving, soft/hard deletion, and bytes counting.
   */
  private async executeStoragePurge(
    policy: DataRetentionPolicy,
    cutoffTimestamp: number,
    attempt: number,
  ): Promise<ReapBatchResult> {
    const limit = policy.maxPurgeLimit || policy.batchSize;
    const records = await this.storageExecutor.fetchExpiredRecords(policy.dataset, cutoffTimestamp, limit);

    if (records.length === 0) {
      return {
        dataset: policy.dataset,
        scannedCount: 0,
        reapedCount: 0,
        archivedCount: 0,
        bytesReclaimed: 0,
        dlqForwardedCount: 0,
        durationMs: 0,
        status: 'SUCCESS',
      };
    }

    let archivedCount = 0;
    if (policy.archiveBeforeDelete) {
      archivedCount = await this.storageExecutor.archiveRecords(records);
    }

    const reapedCount = await this.storageExecutor.deleteRecords(records, !!policy.softDelete);
    const bytesReclaimed = records.slice(0, reapedCount).reduce((acc, r) => acc + (r.sizeBytes || 0), 0);

    return {
      dataset: policy.dataset,
      scannedCount: records.length,
      reapedCount,
      archivedCount,
      bytesReclaimed,
      dlqForwardedCount: 0,
      durationMs: 0,
      status: 'SUCCESS',
    };
  }

  public exportPrometheusMetrics(): string {
    return this.metrics.exportMetrics();
  }

  public getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  public getDlqRecords(dataset?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>> {
    return this.dlq.getRecords(dataset);
  }
}
