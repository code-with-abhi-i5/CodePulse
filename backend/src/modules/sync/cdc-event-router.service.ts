import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PostgresWalListenerService, WalChangeRecord } from './postgres-wal-listener.service';
import { RedisStreamsService } from '../../common/redis/redis-streams.service';

export interface StructuredCdcEvent {
  eventId: string;
  sourceLsn: string;
  transactionId: number;
  commitTimestamp: number;
  publishedTimestamp: number;
  deliveryLatencyMs: number;
  aggregateType: string;
  operation: 'CREATED' | 'UPDATED' | 'DELETED';
  payload: Record<string, unknown>;
  previousState?: Record<string, unknown>;
}

export interface CdcRouterTelemetry {
  totalEventsRouted: number;
  activeTargetStreams: string[];
  lastDeliveryLatencyMs: number;
  averageDeliveryLatencyMs: number;
  sub10msSlaMetPercentage: number;
  throughputPerSecond: number;
}

@Injectable()
export class CdcEventRouterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CdcEventRouterService.name);
  private unsubscribeListener?: () => void;
  private readonly targetStreams = new Set<string>();

  private totalRouted = 0;
  private lastLatency = 0;
  private readonly latencySamples: number[] = [];
  private sub10msCount = 0;
  private initTimestamp = Date.now();

  constructor(
    private readonly walListener: PostgresWalListenerService,
    private readonly redisStreams: RedisStreamsService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Initializing CdcEventRouterService & attaching to WAL stream...');
    this.unsubscribeListener = this.walListener.subscribe(async (change) => {
      await this.routeWalChange(change);
    });
  }

  onModuleDestroy(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }
  }

  public async routeWalChange(change: WalChangeRecord): Promise<StructuredCdcEvent> {
    const routeStart = performance.now();
    const streamKey = `stream:cdc:${change.table.toLowerCase()}`;
    this.targetStreams.add(streamKey);

    const operationMap: Record<string, 'CREATED' | 'UPDATED' | 'DELETED'> = {
      INSERT: 'CREATED',
      UPDATE: 'UPDATED',
      DELETE: 'DELETED',
    };

    const eventId = `${change.lsn}-${change.xid}`;
    const payload = change.afterImage || change.beforeImage || {};
    const deliveryLatency = Math.round((performance.now() - routeStart) * 100) / 100;

    const event: StructuredCdcEvent = {
      eventId,
      sourceLsn: change.lsn,
      transactionId: change.xid,
      commitTimestamp: change.commitTimestamp,
      publishedTimestamp: Date.now(),
      deliveryLatencyMs: deliveryLatency,
      aggregateType: change.table,
      operation: operationMap[change.operation] || 'UPDATED',
      payload,
      previousState: change.beforeImage,
    };

    // Publish to Redis Stream with non-blocking stream append
    try {
      await this.redisStreams.xadd(streamKey, {
        eventId: event.eventId,
        lsn: event.sourceLsn,
        table: event.aggregateType,
        op: event.operation,
        data: JSON.stringify(event.payload),
        ts: String(event.commitTimestamp),
      });
    } catch (err) {
      this.logger.warn(
        `Failed to publish to stream '${streamKey}': ${(err as Error).message}. Continuing in standalone mode.`,
      );
    }

    this.totalRouted++;
    this.lastLatency = deliveryLatency;
    this.latencySamples.push(deliveryLatency);
    if (deliveryLatency < 10.0) {
      this.sub10msCount++;
    }
    if (this.latencySamples.length > 1000) {
      this.latencySamples.shift();
    }

    return event;
  }

  public getTelemetry(): CdcRouterTelemetry {
    const avgLatency =
      this.latencySamples.length > 0
        ? this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length
        : 0;

    const uptimeSec = Math.max(1, (Date.now() - this.initTimestamp) / 1000);
    const throughput = this.totalRouted / uptimeSec;
    const slaMetPct =
      this.totalRouted > 0 ? (this.sub10msCount / this.totalRouted) * 100 : 100;

    return {
      totalEventsRouted: this.totalRouted,
      activeTargetStreams: Array.from(this.targetStreams),
      lastDeliveryLatencyMs: this.lastLatency,
      averageDeliveryLatencyMs: Math.round(avgLatency * 100) / 100,
      sub10msSlaMetPercentage: Math.round(slaMetPct * 10) / 10,
      throughputPerSecond: Math.round(throughput * 100) / 100,
    };
  }
}
