import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// Core Types & Modular Interfaces (Strict TypeScript 5.9, Zero 'any')
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type BillingTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export type ResourceDimension =
  | 'COMPUTE_SECONDS'
  | 'MEMORY_MB_SECONDS'
  | 'STORAGE_GIGABYTES'
  | 'NETWORK_EGRESS_GB'
  | 'API_INVOCATIONS'
  | 'AI_TOKENS';

export interface BillingRateCard {
  readonly tier: BillingTier;
  readonly dimensionRates: Readonly<Record<ResourceDimension, number>>;
  readonly includedAllowances: Readonly<Record<ResourceDimension, number>>;
  readonly overageMultipliers?: Readonly<Partial<Record<ResourceDimension, number>>>;
}

export interface RawUsageEvent {
  readonly eventId: string;
  readonly idempotencyKey: string;
  readonly tenantId: string;
  readonly dimension: ResourceDimension;
  readonly units: number;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface AggregatedTenantUsage {
  readonly tenantId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly dimensions: Readonly<Record<ResourceDimension, number>>;
  readonly totalEventsCount: number;
  readonly lastEventTimestamp: number;
}

export interface TenantInvoiceItem {
  readonly dimension: ResourceDimension;
  readonly consumedUnits: number;
  readonly allowanceUnits: number;
  readonly billableUnits: number;
  readonly unitRateUsd: number;
  readonly totalCostUsd: number;
}

export interface TenantBillingStatement {
  readonly statementId: string;
  readonly tenantId: string;
  readonly tier: BillingTier;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly items: ReadonlyArray<TenantInvoiceItem>;
  readonly subtotalUsd: number;
  readonly taxUsd: number;
  readonly totalUsd: number;
  readonly currency: 'USD';
  readonly status: 'DRAFT' | 'FINALIZED' | 'SETTLED' | 'DISPUTED';
  readonly generatedAt: number;
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
  readonly tenantId: string;
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
  getRecords(tenantId?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>>;
  getRecordCount(tenantId?: string): number;
  replay(recordId: string, processor: (record: DeadLetterQueueRecord<unknown>) => Promise<boolean>): Promise<boolean>;
  purge(tenantId?: string): number;
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
  incrementUsageEvents(tenantId: string, dimension: ResourceDimension, count: number): void;
  incrementUnitsConsumed(tenantId: string, dimension: ResourceDimension, units: number): void;
  incrementRevenueAccrued(tenantId: string, tier: BillingTier, amountUsd: number): void;
  incrementErrors(tenantId: string, errorType: string): void;
  incrementDlqEvents(tenantId: string, count: number): void;
  setCircuitBreakerState(circuit: string, state: CircuitState): void;
  observeComputationDuration(tenantId: string, durationSeconds: number): void;
  exportMetrics(): string;
}

export type WinstonLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface WinstonLogEvent {
  readonly event:
    | 'USAGE_EVENT_INGESTED'
    | 'USAGE_EVENT_DEDUPLICATED'
    | 'USAGE_AGGREGATED'
    | 'STATEMENT_GENERATED'
    | 'BILLING_RETRY_SCHEDULED'
    | 'CIRCUIT_BREAKER_TRIPPED'
    | 'CIRCUIT_BREAKER_HALF_OPEN'
    | 'CIRCUIT_BREAKER_RESET'
    | 'CIRCUIT_BREAKER_REJECTED'
    | 'DLQ_EVENT_ENQUEUED'
    | 'BILLING_CYCLE_COMPLETED';
  readonly message: string;
  readonly timestamp: number;
  readonly tenantId?: string;
  readonly [key: string]: unknown;
}

export interface IWinstonLogger {
  log(level: WinstonLogLevel, event: WinstonLogEvent): void;
  info(event: WinstonLogEvent): void;
  warn(event: WinstonLogEvent): void;
  error(event: WinstonLogEvent): void;
  debug(event: WinstonLogEvent): void;
}

export interface IBillingStorageProvider {
  saveUsageEvent(event: RawUsageEvent): Promise<boolean>;
  fetchUsageEvents(tenantId: string, since: number, until: number): Promise<ReadonlyArray<RawUsageEvent>>;
  saveStatement(statement: TenantBillingStatement): Promise<void>;
  fetchStatement(statementId: string): Promise<TenantBillingStatement | undefined>;
}

// ============================================================================
// Custom Exceptions
// ============================================================================

export class BillingCircuitBreakerOpenException extends Error {
  constructor(message: string = 'BillingCircuitBreaker: Circuit is OPEN, rejecting operation') {
    super(message);
    this.name = 'BillingCircuitBreakerOpenException';
    Object.setPrototypeOf(this, BillingCircuitBreakerOpenException.prototype);
  }
}

export class InvalidUsageEventException extends Error {
  constructor(message: string = 'InvalidUsageEvent: Provided usage event is invalid') {
    super(message);
    this.name = 'InvalidUsageEventException';
    Object.setPrototypeOf(this, InvalidUsageEventException.prototype);
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
    return Math.round(randomFn() * rawDelay);
  }

  public static async executeWithRetry<T>(
    operation: (attempt: number) => Promise<T>,
    policy: RetryPolicyConfig,
    onRetry?: (error: Error, attempt: number, delayMs: number) => void,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  ): Promise<T> {
    let lastError: Error = new Error('Unknown billing retry failure');

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        return await operation(attempt);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt >= policy.maxRetries) {
          break;
        }

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

export class BillingCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private consecutiveSuccesses = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 3,
      recoveryTimeoutMs: 3000,
      halfOpenSuccessThreshold: 2,
    },
  ) {}

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
      throw new BillingCircuitBreakerOpenException(
        `BillingCircuitBreaker is OPEN (tripped at ${new Date(this.lastFailureTime).toISOString()})`,
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

  public getRecords(tenantId?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>> {
    const list = Array.from(this.records.values());
    if (!tenantId) {
      return list;
    }
    return list.filter((r) => r.tenantId === tenantId);
  }

  public getRecordCount(tenantId?: string): number {
    return this.getRecords(tenantId).length;
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

  public purge(tenantId?: string): number {
    if (!tenantId) {
      const count = this.records.size;
      this.records.clear();
      return count;
    }
    let purged = 0;
    for (const [id, rec] of this.records.entries()) {
      if (rec.tenantId === tenantId) {
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
  private readonly usageEvents: Map<string, Map<ResourceDimension, number>> = new Map();
  private readonly unitsConsumed: Map<string, Map<ResourceDimension, number>> = new Map();
  private readonly revenueAccrued: Map<string, Map<BillingTier, number>> = new Map();
  private readonly errors: Map<string, Map<string, number>> = new Map();
  private readonly dlqEvents: Map<string, number> = new Map();
  private readonly circuitStates: Map<string, CircuitState> = new Map();
  private readonly computationDurations: Map<string, number> = new Map();

  public incrementUsageEvents(tenantId: string, dimension: ResourceDimension, count: number): void {
    let dimMap = this.usageEvents.get(tenantId);
    if (!dimMap) {
      dimMap = new Map();
      this.usageEvents.set(tenantId, dimMap);
    }
    dimMap.set(dimension, (dimMap.get(dimension) || 0) + count);
  }

  public incrementUnitsConsumed(tenantId: string, dimension: ResourceDimension, units: number): void {
    let dimMap = this.unitsConsumed.get(tenantId);
    if (!dimMap) {
      dimMap = new Map();
      this.unitsConsumed.set(tenantId, dimMap);
    }
    dimMap.set(dimension, (dimMap.get(dimension) || 0) + units);
  }

  public incrementRevenueAccrued(tenantId: string, tier: BillingTier, amountUsd: number): void {
    let tierMap = this.revenueAccrued.get(tenantId);
    if (!tierMap) {
      tierMap = new Map();
      this.revenueAccrued.set(tenantId, tierMap);
    }
    tierMap.set(tier, Number(((tierMap.get(tier) || 0) + amountUsd).toFixed(4)));
  }

  public incrementErrors(tenantId: string, errorType: string): void {
    let errMap = this.errors.get(tenantId);
    if (!errMap) {
      errMap = new Map();
      this.errors.set(tenantId, errMap);
    }
    errMap.set(errorType, (errMap.get(errorType) || 0) + 1);
  }

  public incrementDlqEvents(tenantId: string, count: number): void {
    this.dlqEvents.set(tenantId, (this.dlqEvents.get(tenantId) || 0) + count);
  }

  public setCircuitBreakerState(circuit: string, state: CircuitState): void {
    this.circuitStates.set(circuit, state);
  }

  public observeComputationDuration(tenantId: string, durationSeconds: number): void {
    this.computationDurations.set(tenantId, Number(durationSeconds.toFixed(4)));
  }

  public exportMetrics(): string {
    const lines: string[] = [
      '# HELP codepulse_tenant_billing_usage_events_total Total usage events ingested per tenant and dimension',
      '# TYPE codepulse_tenant_billing_usage_events_total counter',
    ];
    for (const [tId, dMap] of this.usageEvents) {
      for (const [dim, val] of dMap) {
        lines.push(`codepulse_tenant_billing_usage_events_total{tenant_id="${tId}",dimension="${dim}"} ${val}`);
      }
    }

    lines.push(
      '# HELP codepulse_tenant_billing_units_consumed_total Total raw resource units consumed per tenant and dimension',
      '# TYPE codepulse_tenant_billing_units_consumed_total counter',
    );
    for (const [tId, dMap] of this.unitsConsumed) {
      for (const [dim, val] of dMap) {
        lines.push(`codepulse_tenant_billing_units_consumed_total{tenant_id="${tId}",dimension="${dim}"} ${val}`);
      }
    }

    lines.push(
      '# HELP codepulse_tenant_billing_revenue_accrued_usd_total Total billable revenue accrued in USD per tenant and tier',
      '# TYPE codepulse_tenant_billing_revenue_accrued_usd_total counter',
    );
    for (const [tId, tMap] of this.revenueAccrued) {
      for (const [tier, val] of tMap) {
        lines.push(`codepulse_tenant_billing_revenue_accrued_usd_total{tenant_id="${tId}",tier="${tier}"} ${val}`);
      }
    }

    lines.push(
      '# HELP codepulse_tenant_billing_errors_total Total errors encountered in tenant billing lifecycle',
      '# TYPE codepulse_tenant_billing_errors_total counter',
    );
    for (const [tId, eMap] of this.errors) {
      for (const [eType, val] of eMap) {
        lines.push(`codepulse_tenant_billing_errors_total{tenant_id="${tId}",error_type="${eType}"} ${val}`);
      }
    }

    lines.push(
      '# HELP codepulse_tenant_billing_dlq_events_total Total failed billing events dispatched to dead letter queue',
      '# TYPE codepulse_tenant_billing_dlq_events_total counter',
    );
    for (const [tId, val] of this.dlqEvents) {
      lines.push(`codepulse_tenant_billing_dlq_events_total{tenant_id="${tId}"} ${val}`);
    }

    lines.push(
      '# HELP codepulse_tenant_billing_circuit_breaker_state Circuit breaker status (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
      '# TYPE codepulse_tenant_billing_circuit_breaker_state gauge',
    );
    for (const [circuit, state] of this.circuitStates) {
      const code = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2;
      lines.push(`codepulse_tenant_billing_circuit_breaker_state{circuit="${circuit}",state="${state}"} ${code}`);
    }

    lines.push(
      '# HELP codepulse_tenant_billing_computation_duration_seconds Last statement computation duration in seconds',
      '# TYPE codepulse_tenant_billing_computation_duration_seconds gauge',
    );
    for (const [tId, dur] of this.computationDurations) {
      lines.push(`codepulse_tenant_billing_computation_duration_seconds{tenant_id="${tId}"} ${dur}`);
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
// Default In-Memory Billing Storage Provider
// ============================================================================

export class InMemoryBillingStorageProvider implements IBillingStorageProvider {
  private readonly events: Map<string, RawUsageEvent[]> = new Map();
  private readonly statements: Map<string, TenantBillingStatement> = new Map();
  private readonly idempotencyKeys: Set<string> = new Set();

  public async saveUsageEvent(event: RawUsageEvent): Promise<boolean> {
    if (this.idempotencyKeys.has(event.idempotencyKey)) {
      return false; // Deduplicated
    }
    this.idempotencyKeys.add(event.idempotencyKey);
    const list = this.events.get(event.tenantId) || [];
    list.push(event);
    this.events.set(event.tenantId, list);
    return true;
  }

  public async fetchUsageEvents(
    tenantId: string,
    since: number,
    until: number,
  ): Promise<ReadonlyArray<RawUsageEvent>> {
    const list = this.events.get(tenantId) || [];
    return list.filter((e) => e.timestamp >= since && e.timestamp <= until);
  }

  public async saveStatement(statement: TenantBillingStatement): Promise<void> {
    this.statements.set(statement.statementId, statement);
  }

  public async fetchStatement(statementId: string): Promise<TenantBillingStatement | undefined> {
    return this.statements.get(statementId);
  }

  public seed(tenantId: string, events: ReadonlyArray<RawUsageEvent>): void {
    for (const e of events) {
      this.idempotencyKeys.add(e.idempotencyKey);
    }
    this.events.set(tenantId, [...events]);
  }
}

// ============================================================================
// Main Service: TenantBillingMeterService
// ============================================================================

@Injectable()
export class TenantBillingMeterService {
  private readonly nestLogger = new Logger(TenantBillingMeterService.name);
  private readonly rateCards: Map<BillingTier, BillingRateCard> = new Map();

  public readonly retryPolicy: RetryPolicyConfig;
  public readonly circuitBreaker: BillingCircuitBreaker;
  public readonly dlq: IDeadLetterQueue;
  public readonly tracer: IOpenTelemetryTracer;
  public readonly metrics: IPrometheusMetricsCollector;
  public readonly winstonLogger: IWinstonLogger;
  public readonly storageProvider: IBillingStorageProvider;

  constructor(options?: {
    storageProvider?: IBillingStorageProvider;
    dlq?: IDeadLetterQueue;
    circuitBreaker?: BillingCircuitBreaker;
    tracer?: IOpenTelemetryTracer;
    metrics?: IPrometheusMetricsCollector;
    winstonLogger?: IWinstonLogger;
    retryPolicy?: Partial<RetryPolicyConfig>;
  }) {
    this.storageProvider = options?.storageProvider ?? new InMemoryBillingStorageProvider();
    this.dlq = options?.dlq ?? new InMemoryDeadLetterQueue();
    this.circuitBreaker = options?.circuitBreaker ?? new BillingCircuitBreaker();
    this.tracer = options?.tracer ?? new DefaultOpenTelemetryTracer();
    this.metrics = options?.metrics ?? new PrometheusMetricsRegistry();
    this.winstonLogger = options?.winstonLogger ?? new StructuredWinstonLogger(this.nestLogger);

    this.retryPolicy = {
      maxRetries: options?.retryPolicy?.maxRetries ?? 3,
      initialBackoffMs: options?.retryPolicy?.initialBackoffMs ?? 50,
      maxBackoffMs: options?.retryPolicy?.maxBackoffMs ?? 2000,
      backoffMultiplier: options?.retryPolicy?.backoffMultiplier ?? 2.0,
      enableJitter: options?.retryPolicy?.enableJitter ?? false,
      isRetryable:
        options?.retryPolicy?.isRetryable ??
        ((err: Error) => {
          const msg = err.message.toLowerCase();
          return (
            msg.includes('timeout') ||
            msg.includes('etimedout') ||
            msg.includes('econnreset') ||
            msg.includes('network') ||
            msg.includes('transient') ||
            msg.includes('503') ||
            msg.includes('429')
          );
        }),
    };

    this.registerStandardRateCards();
  }

  /**
   * Registers default CodePulse billing rate cards across tiers
   */
  private registerStandardRateCards(): void {
    this.registerRateCard({
      tier: 'FREE',
      dimensionRates: {
        COMPUTE_SECONDS: 0.00005,
        MEMORY_MB_SECONDS: 0.000008,
        STORAGE_GIGABYTES: 0.15,
        NETWORK_EGRESS_GB: 0.1,
        API_INVOCATIONS: 0.00001,
        AI_TOKENS: 0.000004,
      },
      includedAllowances: {
        COMPUTE_SECONDS: 3600, // 1 hr free
        MEMORY_MB_SECONDS: 3600 * 512,
        STORAGE_GIGABYTES: 5,
        NETWORK_EGRESS_GB: 10,
        API_INVOCATIONS: 10000,
        AI_TOKENS: 25000,
      },
    });

    this.registerRateCard({
      tier: 'STARTER',
      dimensionRates: {
        COMPUTE_SECONDS: 0.00004,
        MEMORY_MB_SECONDS: 0.000006,
        STORAGE_GIGABYTES: 0.12,
        NETWORK_EGRESS_GB: 0.08,
        API_INVOCATIONS: 0.000008,
        AI_TOKENS: 0.000003,
      },
      includedAllowances: {
        COMPUTE_SECONDS: 36000,
        MEMORY_MB_SECONDS: 36000 * 1024,
        STORAGE_GIGABYTES: 25,
        NETWORK_EGRESS_GB: 50,
        API_INVOCATIONS: 100000,
        AI_TOKENS: 100000,
      },
    });

    this.registerRateCard({
      tier: 'PRO',
      dimensionRates: {
        COMPUTE_SECONDS: 0.00003,
        MEMORY_MB_SECONDS: 0.000005,
        STORAGE_GIGABYTES: 0.08,
        NETWORK_EGRESS_GB: 0.05,
        API_INVOCATIONS: 0.000005,
        AI_TOKENS: 0.000002,
      },
      includedAllowances: {
        COMPUTE_SECONDS: 180000,
        MEMORY_MB_SECONDS: 180000 * 2048,
        STORAGE_GIGABYTES: 100,
        NETWORK_EGRESS_GB: 250,
        API_INVOCATIONS: 500000,
        AI_TOKENS: 500000,
      },
    });

    this.registerRateCard({
      tier: 'ENTERPRISE',
      dimensionRates: {
        COMPUTE_SECONDS: 0.00002,
        MEMORY_MB_SECONDS: 0.000003,
        STORAGE_GIGABYTES: 0.05,
        NETWORK_EGRESS_GB: 0.03,
        API_INVOCATIONS: 0.000003,
        AI_TOKENS: 0.0000015,
      },
      includedAllowances: {
        COMPUTE_SECONDS: 1000000,
        MEMORY_MB_SECONDS: 1000000 * 4096,
        STORAGE_GIGABYTES: 1000,
        NETWORK_EGRESS_GB: 2000,
        API_INVOCATIONS: 5000000,
        AI_TOKENS: 5000000,
      },
    });
  }

  public registerRateCard(rateCard: BillingRateCard): void {
    this.rateCards.set(rateCard.tier, rateCard);
  }

  public getRateCard(tier: BillingTier): BillingRateCard {
    const card = this.rateCards.get(tier);
    if (!card) {
      throw new Error(`Rate card not found for billing tier: ${tier}`);
    }
    return card;
  }

  /**
   * Ingests a granular resource consumption event with idempotency, circuit breaking, and retry resilience
   */
  public async ingestUsageEvent(
    event: RawUsageEvent,
    now: number = Date.now(),
  ): Promise<{ accepted: boolean; deduplicated?: boolean; error?: string }> {
    // 1. Validation
    if (!event.tenantId || !event.idempotencyKey || !event.dimension || typeof event.units !== 'number') {
      throw new InvalidUsageEventException('Usage event is missing required attributes');
    }
    if (event.units < 0) {
      throw new InvalidUsageEventException('Usage units cannot be negative');
    }

    const span = this.tracer.startSpan('tenant_billing.ingest_usage_event', {
      'tenant_billing.tenant_id': event.tenantId,
      'tenant_billing.dimension': event.dimension,
      'tenant_billing.units': event.units,
      'tenant_billing.event_id': event.eventId,
    });

    const currentCircuit = this.circuitBreaker.getState(now);
    this.metrics.setCircuitBreakerState('ingest', currentCircuit);

    // Fast-rejection if Circuit Breaker is OPEN
    if (currentCircuit === 'OPEN') {
      span.setAttribute('circuit_rejection', true);
      span.setStatus({ code: 'ERROR', message: 'Billing circuit breaker is OPEN' });
      span.end();

      this.winstonLogger.warn({
        event: 'CIRCUIT_BREAKER_REJECTED',
        message: `Usage event rejected for tenant ${event.tenantId}: Circuit is OPEN`,
        timestamp: now,
        tenantId: event.tenantId,
      });

      return { accepted: false, error: 'Circuit breaker is OPEN' };
    }

    try {
      const accepted = await this.circuitBreaker.execute(async () => {
        return await ExponentialBackoffExecutor.executeWithRetry<boolean>(
          async () => {
            return await this.storageProvider.saveUsageEvent(event);
          },
          this.retryPolicy,
          (err: Error, attempt: number, delayMs: number) => {
            this.metrics.incrementErrors(event.tenantId, 'STORAGE_RETRY');
            this.winstonLogger.warn({
              event: 'BILLING_RETRY_SCHEDULED',
              message: `Retrying storage save for tenant ${event.tenantId} (attempt ${attempt}) after ${delayMs}ms: ${err.message}`,
              timestamp: Date.now(),
              tenantId: event.tenantId,
              attempt,
              delayMs,
            });
          },
        );
      }, now);

      if (!accepted) {
        // Idempotent duplicate
        this.winstonLogger.info({
          event: 'USAGE_EVENT_DEDUPLICATED',
          message: `Deduplicated usage event ${event.idempotencyKey} for tenant ${event.tenantId}`,
          timestamp: Date.now(),
          tenantId: event.tenantId,
          idempotencyKey: event.idempotencyKey,
        });
        span.setStatus({ code: 'OK' });
        span.end();
        return { accepted: false, deduplicated: true };
      }

      // Update Prometheus metrics
      this.metrics.incrementUsageEvents(event.tenantId, event.dimension, 1);
      this.metrics.incrementUnitsConsumed(event.tenantId, event.dimension, event.units);

      this.winstonLogger.info({
        event: 'USAGE_EVENT_INGESTED',
        message: `Ingested ${event.units} ${event.dimension} for tenant ${event.tenantId}`,
        timestamp: Date.now(),
        tenantId: event.tenantId,
        dimension: event.dimension,
        units: event.units,
      });

      span.setStatus({ code: 'OK' });
      span.end();
      return { accepted: true };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.metrics.incrementErrors(event.tenantId, error.name || 'STORAGE_ERROR');

      span.recordException(error);
      span.setStatus({ code: 'ERROR', message: error.message });
      span.end();

      // Dispatch to Dead Letter Queue for poison pill / exhausted failure recovery
      const dlqRecord: DeadLetterQueueRecord<RawUsageEvent> = {
        recordId: `dlq_${event.tenantId}_${event.eventId}`,
        tenantId: event.tenantId,
        payload: event,
        failureReason: error.message,
        stackTrace: error.stack,
        attempts: this.retryPolicy.maxRetries + 1,
        firstFailedAt: now,
        lastFailedAt: Date.now(),
        isRetryable: false,
      };

      await this.dlq.enqueue(dlqRecord);
      this.metrics.incrementDlqEvents(event.tenantId, 1);

      this.winstonLogger.error({
        event: 'DLQ_EVENT_ENQUEUED',
        message: `Forwarded failed usage event ${event.eventId} to DLQ: ${error.message}`,
        timestamp: Date.now(),
        tenantId: event.tenantId,
        error: error.message,
      });

      return { accepted: false, error: error.message };
    }
  }

  /**
   * Aggregates tenant usage across all resource dimensions within a designated billing period
   */
  public async aggregateUsage(
    tenantId: string,
    since: number,
    until: number,
    now: number = Date.now(),
  ): Promise<AggregatedTenantUsage> {
    const span = this.tracer.startSpan('tenant_billing.aggregate_usage', {
      'tenant_billing.tenant_id': tenantId,
      'tenant_billing.period_since': since,
      'tenant_billing.period_until': until,
    });

    const events = await this.storageProvider.fetchUsageEvents(tenantId, since, until);

    const initialDimensions: Record<ResourceDimension, number> = {
      COMPUTE_SECONDS: 0,
      MEMORY_MB_SECONDS: 0,
      STORAGE_GIGABYTES: 0,
      NETWORK_EGRESS_GB: 0,
      API_INVOCATIONS: 0,
      AI_TOKENS: 0,
    };

    let lastTimestamp = since;

    for (const e of events) {
      initialDimensions[e.dimension] = (initialDimensions[e.dimension] || 0) + e.units;
      if (e.timestamp > lastTimestamp) {
        lastTimestamp = e.timestamp;
      }
    }

    const aggregated: AggregatedTenantUsage = {
      tenantId,
      periodStart: since,
      periodEnd: until,
      dimensions: initialDimensions,
      totalEventsCount: events.length,
      lastEventTimestamp: lastTimestamp,
    };

    this.winstonLogger.info({
      event: 'USAGE_AGGREGATED',
      message: `Aggregated ${events.length} usage events for tenant ${tenantId}`,
      timestamp: now,
      tenantId,
      totalEventsCount: events.length,
    });

    span.setAttribute('events_count', events.length);
    span.setStatus({ code: 'OK' });
    span.end();

    return aggregated;
  }

  /**
   * Computes billable overage, applies allowances, generates line items, and finalizes statement
   */
  public async generateStatement(
    tenantId: string,
    tier: BillingTier,
    periodStart: number,
    periodEnd: number,
    taxRate: number = 0.0,
    now: number = Date.now(),
  ): Promise<TenantBillingStatement> {
    const startTime = Date.now();
    const span = this.tracer.startSpan('tenant_billing.generate_statement', {
      'tenant_billing.tenant_id': tenantId,
      'tenant_billing.tier': tier,
    });

    const rateCard = this.getRateCard(tier);
    const usage = await this.aggregateUsage(tenantId, periodStart, periodEnd, now);

    const items: TenantInvoiceItem[] = [];
    let subtotalUsd = 0;

    const dimensions: ResourceDimension[] = [
      'COMPUTE_SECONDS',
      'MEMORY_MB_SECONDS',
      'STORAGE_GIGABYTES',
      'NETWORK_EGRESS_GB',
      'API_INVOCATIONS',
      'AI_TOKENS',
    ];

    for (const dim of dimensions) {
      const consumed = usage.dimensions[dim] || 0;
      const allowance = rateCard.includedAllowances[dim] || 0;
      const rate = rateCard.dimensionRates[dim] || 0;
      const multiplier = rateCard.overageMultipliers?.[dim] ?? 1.0;

      const billableUnits = Math.max(0, consumed - allowance);
      const totalCostUsd = Number((billableUnits * rate * multiplier).toFixed(4));
      subtotalUsd += totalCostUsd;

      items.push({
        dimension: dim,
        consumedUnits: consumed,
        allowanceUnits: allowance,
        billableUnits,
        unitRateUsd: rate,
        totalCostUsd,
      });
    }

    subtotalUsd = Number(subtotalUsd.toFixed(4));
    const taxUsd = Number((subtotalUsd * taxRate).toFixed(4));
    const totalUsd = Number((subtotalUsd + taxUsd).toFixed(4));

    const statementId = `stmt_${tenantId}_${periodStart}_${periodEnd}`;
    const statement: TenantBillingStatement = {
      statementId,
      tenantId,
      tier,
      periodStart,
      periodEnd,
      items,
      subtotalUsd,
      taxUsd,
      totalUsd,
      currency: 'USD',
      status: 'FINALIZED',
      generatedAt: now,
    };

    await this.storageProvider.saveStatement(statement);

    const durationSeconds = (Date.now() - startTime) / 1000;
    this.metrics.incrementRevenueAccrued(tenantId, tier, totalUsd);
    this.metrics.observeComputationDuration(tenantId, durationSeconds);

    this.winstonLogger.info({
      event: 'STATEMENT_GENERATED',
      message: `Generated statement ${statementId} for tenant ${tenantId}: Total $${totalUsd} USD`,
      timestamp: Date.now(),
      tenantId,
      statementId,
      subtotalUsd,
      totalUsd,
      tier,
    });

    span.setAttribute('total_usd', totalUsd);
    span.setStatus({ code: 'OK' });
    span.end();

    return statement;
  }

  public exportPrometheusMetrics(): string {
    return this.metrics.exportMetrics();
  }

  public getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  public getDlqRecords(tenantId?: string): ReadonlyArray<DeadLetterQueueRecord<unknown>> {
    return this.dlq.getRecords(tenantId);
  }
}
