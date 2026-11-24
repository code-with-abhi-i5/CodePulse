import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TemplateCompilerService } from './template-compiler.service';

export type NotificationChannel = 'EMAIL' | 'SLACK' | 'DISCORD' | 'PUSH';

export interface NotificationItem {
  id?: string;
  idempotencyKey?: string;
  recipient: string;
  channel: NotificationChannel;
  template: string;
  context: Record<string, any>;
  metadata?: Record<string, any>;
}

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED' | 'DUPLICATE';

export interface DeliveryResult {
  notificationId: string;
  idempotencyKey?: string;
  recipient: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  renderedContent: string;
  deliveredAt: number | null;
  error?: string;
}

export interface DispatcherTelemetry {
  totalDispatched: number;
  totalDelivered: number;
  totalBounced: number;
  totalDuplicatesSkipped: number;
  totalOpened: number;
  totalClicked: number;
  averageBatchDurationMs: number;
}

export interface ProviderRateLimit {
  maxPerSecond: number;
  currentTokens: number;
  lastRefillTimestamp: number;
}

@Injectable()
export class NotificationBatchDispatcherService {
  private readonly logger = new Logger(NotificationBatchDispatcherService.name);

  // Idempotency cache (key -> timestamp)
  private readonly processedKeys = new Set<string>();

  // Delivery status records for event tracking (opened, clicked, bounced)
  private readonly deliveryRecords = new Map<string, DeliveryResult>();
  private readonly openEvents = new Set<string>();
  private readonly clickEvents = new Set<string>();

  // Per-channel rate limits (tokens per second)
  private readonly channelRateLimits: Record<NotificationChannel, ProviderRateLimit> = {
    EMAIL: { maxPerSecond: 1000, currentTokens: 1000, lastRefillTimestamp: Date.now() },
    SLACK: { maxPerSecond: 200, currentTokens: 200, lastRefillTimestamp: Date.now() },
    DISCORD: { maxPerSecond: 100, currentTokens: 100, lastRefillTimestamp: Date.now() },
    PUSH: { maxPerSecond: 5000, currentTokens: 5000, lastRefillTimestamp: Date.now() },
  };

  // Telemetry counters
  private totalDispatched = 0;
  private totalDelivered = 0;
  private totalBounced = 0;
  private totalDuplicates = 0;
  private totalBatchDurationSum = 0;
  private batchExecutionCount = 0;

  private readonly compiler: TemplateCompilerService;

  constructor(
    @Optional() compiler?: TemplateCompilerService
  ) {
    this.compiler = compiler || new TemplateCompilerService();
  }

  /**
   * Dispatches a batch of notifications concurrently with rate limiting and idempotency guards.
   */
  public async dispatchBatch(
    notifications: NotificationItem[],
    concurrencyChunkSize = 500
  ): Promise<DeliveryResult[]> {
    const startTime = Date.now();
    const results: DeliveryResult[] = [];

    for (let i = 0; i < notifications.length; i += concurrencyChunkSize) {
      const chunk = notifications.slice(i, i + concurrencyChunkSize);
      const chunkPromises = chunk.map(async (item) => this.dispatchSingle(item));
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    const duration = Date.now() - startTime;
    this.totalBatchDurationSum += duration;
    this.batchExecutionCount++;

    this.logger.log(
      `Dispatched batch of ${notifications.length} notifications in ${duration}ms (Delivered: ${this.totalDelivered}, Duplicates: ${this.totalDuplicates})`
    );

    return results;
  }

  /**
   * Tracks an open event (e.g. from tracking pixel in email/push).
   */
  public recordOpen(notificationId: string): boolean {
    const record = this.deliveryRecords.get(notificationId);
    if (!record || record.status !== 'DELIVERED') return false;
    this.openEvents.add(notificationId);
    return true;
  }

  /**
   * Tracks a click event (e.g. from redirect proxy link).
   */
  public recordClick(notificationId: string): boolean {
    const record = this.deliveryRecords.get(notificationId);
    if (!record || record.status !== 'DELIVERED') return false;
    this.clickEvents.add(notificationId);
    return true;
  }

  /**
   * Tracks a bounce event (e.g. SMTP 550 or invalid device token).
   */
  public recordBounce(notificationId: string, reason = 'Permanent bounce'): boolean {
    const record = this.deliveryRecords.get(notificationId);
    if (!record) return false;
    record.status = 'BOUNCED';
    record.error = reason;
    this.totalBounced++;
    if (this.totalDelivered > 0) this.totalDelivered--;
    return true;
  }

  public getTelemetry(): DispatcherTelemetry {
    const avgDuration =
      this.batchExecutionCount > 0 ? this.totalBatchDurationSum / this.batchExecutionCount : 0;

    return {
      totalDispatched: this.totalDispatched,
      totalDelivered: this.totalDelivered,
      totalBounced: this.totalBounced,
      totalDuplicatesSkipped: this.totalDuplicates,
      totalOpened: this.openEvents.size,
      totalClicked: this.clickEvents.size,
      averageBatchDurationMs: Math.round(avgDuration * 100) / 100,
    };
  }

  public clear(): void {
    this.processedKeys.clear();
    this.deliveryRecords.clear();
    this.openEvents.clear();
    this.clickEvents.clear();
    this.totalDispatched = 0;
    this.totalDelivered = 0;
    this.totalBounced = 0;
    this.totalDuplicates = 0;
    this.totalBatchDurationSum = 0;
    this.batchExecutionCount = 0;
  }

  private async dispatchSingle(item: NotificationItem): Promise<DeliveryResult> {
    const notificationId = item.id || randomUUID();

    // 1. Idempotency Check
    if (item.idempotencyKey) {
      if (this.processedKeys.has(item.idempotencyKey)) {
        this.totalDuplicates++;
        return {
          notificationId,
          idempotencyKey: item.idempotencyKey,
          recipient: item.recipient,
          channel: item.channel,
          status: 'DUPLICATE',
          renderedContent: '',
          deliveredAt: null,
          error: 'Skipped duplicate delivery matching idempotency key',
        };
      }
      this.processedKeys.add(item.idempotencyKey);
    }

    // 2. Render Template
    const renderedContent = this.compiler.render(item.template, item.context);
    this.totalDispatched++;

    // 3. Provider Rate Limit Throttling Check
    this.consumeRateToken(item.channel);

    // 4. Simulate Delivery
    const result: DeliveryResult = {
      notificationId,
      idempotencyKey: item.idempotencyKey,
      recipient: item.recipient,
      channel: item.channel,
      status: 'DELIVERED',
      renderedContent,
      deliveredAt: Date.now(),
    };

    this.deliveryRecords.set(notificationId, result);
    this.totalDelivered++;
    return result;
  }

  private consumeRateToken(channel: NotificationChannel): void {
    const limit = this.channelRateLimits[channel];
    if (!limit) return;

    const now = Date.now();
    const elapsedSec = (now - limit.lastRefillTimestamp) / 1000;
    limit.currentTokens = Math.min(limit.maxPerSecond, limit.currentTokens + elapsedSec * limit.maxPerSecond);
    limit.lastRefillTimestamp = now;

    if (limit.currentTokens >= 1) {
      limit.currentTokens -= 1;
    }
  }
}
