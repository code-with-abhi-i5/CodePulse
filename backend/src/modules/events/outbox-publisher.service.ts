import { Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RetryJitterService, CircuitBreakerState } from './retry-jitter.service';

export type OutboxStatus = 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';

export interface OutboxRecord<T = any> {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: T;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt: number;
  lastSleepMs: number;
  createdAt: number;
  lockedAt: number | null;
  processedAt: number | null;
  lastError: string | null;
}

export type BrokerPublishHandler<T = any> = (record: OutboxRecord<T>) => Promise<void>;

export interface OutboxPublisherTelemetry {
  totalRecordsEnqueued: number;
  totalPublished: number;
  totalRetried: number;
  totalDeadLettered: number;
  activePendingCount: number;
  activeCircuitBreakerState: CircuitBreakerState;
  averageDispatchDurationMs: number;
}

@Injectable()
export class OutboxPublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);

  // In-memory persistent queue mimicking PostgreSQL table with FOR UPDATE SKIP LOCKED
  private readonly outboxStore = new Map<string, OutboxRecord>();
  private readonly maxRetryLimit = 5;

  private isPollingActive = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private brokerHandler: BrokerPublishHandler | null = null;

  // Telemetry counters
  private totalEnqueued = 0;
  private totalPublished = 0;
  private totalRetried = 0;
  private totalDeadLettered = 0;
  private totalDispatchDurationSum = 0;

  constructor(
    @Optional() private readonly retryJitter?: RetryJitterService
  ) {
    if (!this.retryJitter) {
      this.retryJitter = new RetryJitterService();
    }
  }

  public onModuleDestroy(): void {
    this.stopPolling();
  }

  public registerBrokerHandler(handler: BrokerPublishHandler): void {
    this.brokerHandler = handler;
  }

  /**
   * Enqueues an event into the transactional outbox table.
   */
  public enqueueEvent<T>(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: T
  ): OutboxRecord<T> {
    const record: OutboxRecord<T> = {
      id: randomUUID(),
      aggregateType,
      aggregateId,
      eventType,
      payload,
      status: 'PENDING',
      retryCount: 0,
      nextRetryAt: Date.now(),
      lastSleepMs: 100,
      createdAt: Date.now(),
      lockedAt: null,
      processedAt: null,
      lastError: null,
    };

    this.outboxStore.set(record.id, record);
    this.totalEnqueued++;
    return record;
  }

  /**
   * Simulates non-blocking row acquisition adhering to `FOR UPDATE SKIP LOCKED`.
   * Only fetches rows where status='PENDING' and lockedAt is null and nextRetryAt <= now.
   */
  public fetchBatchForUpdateSkipLocked(batchSize = 50): OutboxRecord[] {
    const now = Date.now();
    const eligible: OutboxRecord[] = [];

    for (const record of this.outboxStore.values()) {
      if (
        (record.status === 'PENDING' || record.status === 'FAILED') &&
        record.lockedAt === null &&
        record.nextRetryAt <= now
      ) {
        // Lock row atomically (SKIP LOCKED semantics)
        record.lockedAt = now;
        record.status = 'PUBLISHING';
        eligible.push(record);
        if (eligible.length >= batchSize) break;
      }
    }

    return eligible;
  }

  /**
   * Executes a dispatch cycle with circuit breaker guards and jittered backoff.
   */
  public async dispatchCycle(batchSize = 50): Promise<number> {
    if (!this.retryJitter?.canExecute()) {
      this.logger.warn('Circuit breaker is OPEN. Dispatch cycle throttled to prevent downstream degradation.');
      return 0;
    }

    const batch = this.fetchBatchForUpdateSkipLocked(batchSize);
    if (batch.length === 0) return 0;

    let successfulInCycle = 0;

    for (const record of batch) {
      const startTime = Date.now();
      try {
        if (this.brokerHandler) {
          await this.brokerHandler(record);
        }

        // Successfully published
        record.status = 'PUBLISHED';
        record.processedAt = Date.now();
        record.lockedAt = null;
        record.lastError = null;

        this.retryJitter.recordSuccess();
        this.totalPublished++;
        successfulInCycle++;

        const duration = Date.now() - startTime;
        this.totalDispatchDurationSum += duration;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to publish outbox event ${record.id}: ${errorMsg}`);

        this.retryJitter.recordFailure();
        record.retryCount++;
        record.lastError = errorMsg;
        record.lockedAt = null;

        if (record.retryCount >= this.maxRetryLimit) {
          // Route to Dead Letter Queue (DLQ)
          record.status = 'DEAD_LETTER';
          this.totalDeadLettered++;
          this.logger.error(`Outbox record ${record.id} exceeded max retries (${this.maxRetryLimit}). Moved to DEAD_LETTER.`);
        } else {
          // Calculate decorrelated jitter for next retry
          record.status = 'FAILED';
          const backoff = this.retryJitter.calculateDecorrelatedJitter(record.lastSleepMs, 100, 30000);
          record.lastSleepMs = backoff;
          record.nextRetryAt = Date.now() + backoff;
          this.totalRetried++;
        }
      }
    }

    return successfulInCycle;
  }

  public startPolling(pollIntervalMs = 500, batchSize = 50): void {
    if (this.isPollingActive) return;
    this.isPollingActive = true;

    const poll = async () => {
      if (!this.isPollingActive) return;
      try {
        await this.dispatchCycle(batchSize);
      } catch (e) {
        this.logger.error(`Error in outbox polling cycle: ${e}`);
      }
      if (this.isPollingActive) {
        this.pollTimer = setTimeout(poll, pollIntervalMs);
        if (this.pollTimer.unref) this.pollTimer.unref();
      }
    };

    this.pollTimer = setTimeout(poll, pollIntervalMs);
    if (this.pollTimer.unref) this.pollTimer.unref();
  }

  public stopPolling(): void {
    this.isPollingActive = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public getRecord(id: string): OutboxRecord | undefined {
    return this.outboxStore.get(id);
  }

  public getTelemetry(): OutboxPublisherTelemetry {
    let pendingCount = 0;
    for (const r of this.outboxStore.values()) {
      if (r.status === 'PENDING' || r.status === 'PUBLISHING' || r.status === 'FAILED') {
        pendingCount++;
      }
    }

    const avgDuration =
      this.totalPublished > 0 ? this.totalDispatchDurationSum / this.totalPublished : 0;

    return {
      totalRecordsEnqueued: this.totalEnqueued,
      totalPublished: this.totalPublished,
      totalRetried: this.totalRetried,
      totalDeadLettered: this.totalDeadLettered,
      activePendingCount: pendingCount,
      activeCircuitBreakerState: this.retryJitter?.getState() ?? 'CLOSED',
      averageDispatchDurationMs: Math.round(avgDuration * 100) / 100,
    };
  }

  public clear(): void {
    this.outboxStore.clear();
    this.totalEnqueued = 0;
    this.totalPublished = 0;
    this.totalRetried = 0;
    this.totalDeadLettered = 0;
    this.totalDispatchDurationSum = 0;
    this.retryJitter?.reset();
  }
}
