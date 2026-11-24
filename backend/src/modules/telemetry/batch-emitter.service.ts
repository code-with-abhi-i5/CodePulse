import { Injectable, Logger } from '@nestjs/common';

export type FlushReason = 'SIZE_THRESHOLD' | 'LINGER_TIMEOUT' | 'MANUAL_FLUSH' | 'SHUTDOWN' | 'OVERFLOW_PROTECTION';

export interface TelemetryBatch<T = any> {
  batchId: string;
  items: T[];
  count: number;
  createdAt: number;
  flushedAt: number;
  durationMs: number;
  flushReason: FlushReason;
  throughputMultiplier: number;
  estimatedWireBytes: number;
}

export interface EmitterTelemetryStats {
  totalBatchesEmitted: number;
  totalRecordsEmitted: number;
  averageBatchSize: number;
  averageThroughputMultiplier: number;
  lastFlushTimestamp: number | null;
}

export type BatchSinkHandler<T = any> = (batch: TelemetryBatch<T>) => Promise<void> | void;

@Injectable()
export class BatchEmitterService {
  private readonly logger = new Logger(BatchEmitterService.name);
  private readonly sinks = new Set<BatchSinkHandler>();

  private totalBatches = 0;
  private totalRecords = 0;
  private totalMultiplierSum = 0;
  private lastFlushTimestamp: number | null = null;

  public registerSink<T = any>(sink: BatchSinkHandler<T>): () => void {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }

  public async emitBatch<T>(batch: TelemetryBatch<T>): Promise<void> {
    this.totalBatches++;
    this.totalRecords += batch.count;
    this.totalMultiplierSum += batch.throughputMultiplier;
    this.lastFlushTimestamp = batch.flushedAt;

    this.logger.debug(
      `Emitted batch ${batch.batchId} [${batch.count} records, reason=${batch.flushReason}, multiplier=${batch.throughputMultiplier.toFixed(2)}x, wireBytes=${batch.estimatedWireBytes}]`
    );

    const promises: Promise<void>[] = [];
    for (const sink of this.sinks) {
      try {
        const res = sink(batch);
        if (res instanceof Promise) {
          promises.push(res);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Batch sink error in sink handler: ${errorMsg}`);
      }
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  public getStats(): EmitterTelemetryStats {
    const averageBatchSize = this.totalBatches > 0 ? this.totalRecords / this.totalBatches : 0;
    const averageThroughputMultiplier =
      this.totalBatches > 0 ? this.totalMultiplierSum / this.totalBatches : 1.0;

    return {
      totalBatchesEmitted: this.totalBatches,
      totalRecordsEmitted: this.totalRecords,
      averageBatchSize: Math.round(averageBatchSize * 100) / 100,
      averageThroughputMultiplier: Math.round(averageThroughputMultiplier * 100) / 100,
      lastFlushTimestamp: this.lastFlushTimestamp,
    };
  }

  public reset(): void {
    this.totalBatches = 0;
    this.totalRecords = 0;
    this.totalMultiplierSum = 0;
    this.lastFlushTimestamp = null;
    this.sinks.clear();
  }
}
