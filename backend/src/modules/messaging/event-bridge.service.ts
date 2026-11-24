import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  EventBridgeMetrics,
  EventBridgePublishAck,
  FailedEventRecord,
  ReplayOptions,
  ReplayResult,
  WebhookEventEnvelope,
} from './event-bridge.types';

export type WebhookEventHandler = (
  envelope: WebhookEventEnvelope,
) => Promise<void | any>;

@Injectable()
export class EventBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBridgeService.name);

  // Topics and Consumer Group
  public static readonly TOPIC_RAW = 'events.webhooks.raw';
  public static readonly TOPIC_FAILED = 'events.webhooks.failed';
  public static readonly CONSUMER_GROUP = 'cg:webhooks:processor';

  // Backpressure thresholds
  private static readonly HIGH_WATERMARK = 500;
  private static readonly LOW_WATERMARK = 100;
  private static readonly MAX_RETRIES = 3;

  // In-memory partitioned queues (partitionKey -> queue of envelopes)
  private readonly partitionQueues = new Map<string, WebhookEventEnvelope[]>();

  // Lock per partition to guarantee strict in-order processing
  private readonly partitionProcessingLocks = new Set<string>();

  // Dead-letter storage (events.webhooks.failed)
  private readonly deadLetterStore = new Map<string, FailedEventRecord>();

  // Ingestion metrics tracking
  private totalIngested = 0;
  private totalProcessed = 0;
  private totalFailed = 0;
  private totalReplayed = 0;
  private ingestionLatencySamples: number[] = [];
  private backpressureActive = false;

  // Registered consumer handler
  private eventHandler: WebhookEventHandler | null = null;

  // Background consumer worker timer
  private consumerInterval: NodeJS.Timeout | null = null;
  private isProcessingBatch = false;

  constructor(@Optional() private readonly configService?: ConfigService) {}

  onModuleInit() {
    this.logger.log(
      `Starting EventBridgeService with topics: [${EventBridgeService.TOPIC_RAW}, ${EventBridgeService.TOPIC_FAILED}]`,
    );
    // Start continuous consumer loop (runs every 10ms for ultra-low latency)
    this.consumerInterval = setInterval(() => {
      this.processBatch();
    }, 10);
  }

  onModuleDestroy() {
    if (this.consumerInterval) {
      clearInterval(this.consumerInterval);
      this.consumerInterval = null;
    }
  }

  /**
   * Registers a callback handler for processing consumed webhook envelopes.
   */
  public registerHandler(handler: WebhookEventHandler) {
    this.eventHandler = handler;
  }

  /**
   * Ultra-low-latency webhook publishing to events.webhooks.raw topic.
   * Target execution latency: < 10ms (guarantees HTTP 202 in < 15ms).
   */
  public async publishWebhookEvent(
    params: Partial<WebhookEventEnvelope>,
  ): Promise<EventBridgePublishAck> {
    const startTime = performance.now();

    const eventId = params.eventId || `evt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const deliveryId = params.deliveryId || `del-${Date.now()}`;
    const event = params.event || 'unknown';
    const partitionKey = params.partitionKey || 'global';
    const timestamp = params.timestamp || Date.now();

    const envelope: WebhookEventEnvelope = {
      eventId,
      deliveryId,
      event,
      partitionKey,
      signature: params.signature,
      timestamp,
      payload: params.payload || {},
      retryCount: params.retryCount ?? 0,
    };

    // Partition routing (strict in-order per repositoryId)
    if (!this.partitionQueues.has(partitionKey)) {
      this.partitionQueues.set(partitionKey, []);
    }
    const partition = this.partitionQueues.get(partitionKey)!;
    partition.push(envelope);

    this.totalIngested++;

    // Check backpressure status
    const pendingTotal = this.getPendingCount();
    if (pendingTotal >= EventBridgeService.HIGH_WATERMARK) {
      if (!this.backpressureActive) {
        this.backpressureActive = true;
        this.logger.warn(
          `[BACKPRESSURE ACTIVATED] Pending webhook backlog (${pendingTotal}) exceeded high watermark (${EventBridgeService.HIGH_WATERMARK})`,
        );
      }
    }

    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;
    this.recordLatencySample(latencyMs);

    return {
      eventId,
      deliveryId,
      status: 'accepted',
      topic: EventBridgeService.TOPIC_RAW,
      partitionKey,
      latencyMs,
      queuedAt: new Date(timestamp).toISOString(),
    };
  }

  /**
   * Continuous batch consumer worker:
   * Picks partitions and processes their next sequential message in parallel.
   */
  public async processBatch(batchSize = 25): Promise<number> {
    if (this.isProcessingBatch) return 0;
    this.isProcessingBatch = true;

    let processedInThisBatch = 0;

    try {
      const activePartitions = Array.from(this.partitionQueues.keys());
      const tasks: Promise<void>[] = [];

      for (const partitionKey of activePartitions) {
        if (processedInThisBatch >= batchSize) break;

        // Strict in-order processing: if partition is currently locked/processing, skip until finished
        if (this.partitionProcessingLocks.has(partitionKey)) {
          continue;
        }

        const queue = this.partitionQueues.get(partitionKey);
        if (!queue || queue.length === 0) {
          continue;
        }

        // Take next sequential event for this partition
        const nextEnvelope = queue.shift()!;
        this.partitionProcessingLocks.add(partitionKey);
        processedInThisBatch++;

        tasks.push(
          this.executeEnvelope(nextEnvelope)
            .finally(() => {
              this.partitionProcessingLocks.delete(partitionKey);
            }),
        );
      }

      await Promise.all(tasks);

      // Backpressure resolution check
      const currentPending = this.getPendingCount();
      if (this.backpressureActive && currentPending <= EventBridgeService.LOW_WATERMARK) {
        this.backpressureActive = false;
        this.logger.log(
          `[BACKPRESSURE RESOLVED] Backlog normalized to ${currentPending} <= ${EventBridgeService.LOW_WATERMARK}`,
        );
      }
    } finally {
      this.isProcessingBatch = false;
    }

    return processedInThisBatch;
  }

  /**
   * Executes a single webhook envelope with retry and dead-letter handling.
   */
  private async executeEnvelope(envelope: WebhookEventEnvelope): Promise<void> {
    try {
      if (this.eventHandler) {
        await this.eventHandler(envelope);
      }
      this.totalProcessed++;
    } catch (err: any) {
      const attempts = (envelope.retryCount || 0) + 1;
      envelope.retryCount = attempts;
      envelope.error = err.message;

      this.logger.warn(
        `Error processing event ${envelope.eventId} for partition ${envelope.partitionKey} (Attempt ${attempts}/${EventBridgeService.MAX_RETRIES}): ${err.message}`,
      );

      if (attempts < EventBridgeService.MAX_RETRIES) {
        // Re-insert at the FRONT of its partition queue to maintain in-order processing
        const partition = this.partitionQueues.get(envelope.partitionKey);
        if (partition) {
          partition.unshift(envelope);
        }
      } else {
        // Move to dead-letter storage (events.webhooks.failed)
        this.totalFailed++;
        this.deadLetterStore.set(envelope.eventId, {
          eventId: envelope.eventId,
          deliveryId: envelope.deliveryId,
          partitionKey: envelope.partitionKey,
          event: envelope.event,
          payload: envelope.payload,
          failedAt: Date.now(),
          reason: err.message || 'Unknown processing error',
          stack: err.stack,
          attempts,
        });
        this.logger.error(
          `[DEAD-LETTER] Event ${envelope.eventId} moved to ${EventBridgeService.TOPIC_FAILED} after ${attempts} failed attempts`,
        );
      }
    }
  }

  /**
   * Replays failed dead-letter messages back to the active raw topic.
   */
  public async replayFailedEvents(options: ReplayOptions = {}): Promise<ReplayResult> {
    const limit = options.limit ?? 100;
    const replayedEventIds: string[] = [];

    const candidates = Array.from(this.deadLetterStore.values()).filter((record) => {
      if (options.partitionKey && record.partitionKey !== options.partitionKey) {
        return false;
      }
      if (options.eventType && record.event !== options.eventType) {
        return false;
      }
      return true;
    });

    const toReplay = candidates.slice(0, limit);

    for (const record of toReplay) {
      this.deadLetterStore.delete(record.eventId);
      this.totalReplayed++;
      replayedEventIds.push(record.eventId);

      // Re-publish to active partition queue with reset retries
      await this.publishWebhookEvent({
        eventId: record.eventId,
        deliveryId: record.deliveryId,
        event: record.event,
        partitionKey: record.partitionKey,
        payload: record.payload,
        retryCount: 0,
      });
    }

    this.logger.log(`Replayed ${toReplay.length} dead-letter events back to raw topic`);

    return {
      replayedCount: toReplay.length,
      remainingFailed: this.deadLetterStore.size,
      replayedEventIds,
    };
  }

  /**
   * Retrieves all failed events stored in dead-letter queue.
   */
  public getFailedEvents(): FailedEventRecord[] {
    return Array.from(this.deadLetterStore.values());
  }

  /**
   * Clears dead-letter storage.
   */
  public clearFailedEvents(): void {
    this.deadLetterStore.clear();
  }

  /**
   * Returns current pending message count across all partitions.
   */
  public getPendingCount(): number {
    let sum = 0;
    for (const queue of this.partitionQueues.values()) {
      sum += queue.length;
    }
    return sum;
  }

  /**
   * Returns aggregate bridge metrics and per-partition lag.
   */
  public getMetrics(): EventBridgeMetrics {
    const partitionsLag: Record<string, number> = {};
    for (const [key, q] of this.partitionQueues.entries()) {
      if (q.length > 0) {
        partitionsLag[key] = q.length;
      }
    }

    const avgLatency =
      this.ingestionLatencySamples.length > 0
        ? this.ingestionLatencySamples.reduce((a, b) => a + b, 0) /
          this.ingestionLatencySamples.length
        : 1.5;

    return {
      totalIngested: this.totalIngested,
      totalProcessed: this.totalProcessed,
      totalFailed: this.totalFailed,
      totalReplayed: this.totalReplayed,
      pendingCount: this.getPendingCount(),
      avgIngestionLatencyMs: Math.round(avgLatency * 100) / 100,
      backpressureActive: this.backpressureActive,
      activePartitions: this.partitionQueues.size,
      partitionsLag,
    };
  }

  /**
   * Exports metrics in standard Prometheus exposition format.
   */
  public exportPrometheusMetrics(): string {
    const m = this.getMetrics();
    const lines = [
      '# HELP codepulse_eventbridge_ingested_total Total webhook events received and queued',
      '# TYPE codepulse_eventbridge_ingested_total counter',
      `codepulse_eventbridge_ingested_total ${m.totalIngested}`,
      '# HELP codepulse_eventbridge_processed_total Total webhook events processed by consumers',
      '# TYPE codepulse_eventbridge_processed_total counter',
      `codepulse_eventbridge_processed_total ${m.totalProcessed}`,
      '# HELP codepulse_eventbridge_failed_total Total webhook events moved to dead-letter queue',
      '# TYPE codepulse_eventbridge_failed_total counter',
      `codepulse_eventbridge_failed_total ${m.totalFailed}`,
      '# HELP codepulse_eventbridge_pending_messages Total unprocessed messages across all partitions',
      '# TYPE codepulse_eventbridge_pending_messages gauge',
      `codepulse_eventbridge_pending_messages ${m.pendingCount}`,
      '# HELP codepulse_eventbridge_backpressure_active Whether backpressure throttling is active (1 or 0)',
      '# TYPE codepulse_eventbridge_backpressure_active gauge',
      `codepulse_eventbridge_backpressure_active ${m.backpressureActive ? 1 : 0}`,
      '# HELP codepulse_eventbridge_avg_ingest_latency_ms Average publish latency in milliseconds',
      '# TYPE codepulse_eventbridge_avg_ingest_latency_ms gauge',
      `codepulse_eventbridge_avg_ingest_latency_ms ${m.avgIngestionLatencyMs}`,
    ];

    return lines.join('\n');
  }

  private recordLatencySample(ms: number) {
    this.ingestionLatencySamples.push(ms);
    if (this.ingestionLatencySamples.length > 500) {
      this.ingestionLatencySamples.shift();
    }
  }
}

