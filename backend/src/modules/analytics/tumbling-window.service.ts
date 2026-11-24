import { Injectable, Logger } from '@nestjs/common';

export interface WindowBucket {
  windowStartMs: number;
  windowEndMs: number;
  eventsCount: number;
  successCount: number;
  failureCount: number;
  durationSumMs: number;
  uniqueEntities: Set<string>;
}

export interface WindowAggregatedResult {
  totalEvents: number;
  successRatePercent: number;
  averageDurationMs: number;
  distinctEntityCount: number;
  windowSpanMs: number;
}

@Injectable()
export class TumblingWindowService {
  private readonly logger = new Logger(TumblingWindowService.name);

  // Map of category -> Map of windowStartMs -> WindowBucket
  private readonly tumblingWindows = new Map<string, Map<number, WindowBucket>>();

  /**
   * Records an observation into a tumbling time bucket.
   */
  public recordEvent(
    category: string,
    timestamp: number,
    isSuccess: boolean,
    durationMs = 0,
    entityId?: string,
    bucketSizeMs = 60000 // default 1-minute tumbling buckets
  ): void {
    const bucketStart = Math.floor(timestamp / bucketSizeMs) * bucketSizeMs;
    const bucketEnd = bucketStart + bucketSizeMs;

    let categoryMap = this.tumblingWindows.get(category);
    if (!categoryMap) {
      categoryMap = new Map<number, WindowBucket>();
      this.tumblingWindows.set(category, categoryMap);
    }

    let bucket = categoryMap.get(bucketStart);
    if (!bucket) {
      bucket = {
        windowStartMs: bucketStart,
        windowEndMs: bucketEnd,
        eventsCount: 0,
        successCount: 0,
        failureCount: 0,
        durationSumMs: 0,
        uniqueEntities: new Set<string>(),
      };
      categoryMap.set(bucketStart, bucket);
    }

    bucket.eventsCount++;
    if (isSuccess) bucket.successCount++;
    else bucket.failureCount++;

    bucket.durationSumMs += Math.max(0, durationMs);
    if (entityId) {
      bucket.uniqueEntities.add(entityId);
    }
  }

  /**
   * Queries rolling aggregated statistics across all tumbling buckets within [now - windowMs, now].
   */
  public querySlidingAggregation(
    category: string,
    now: number,
    windowSpanMs: number
  ): WindowAggregatedResult {
    const minTimestamp = now - windowSpanMs;
    const categoryMap = this.tumblingWindows.get(category);

    if (!categoryMap) {
      return {
        totalEvents: 0,
        successRatePercent: 100,
        averageDurationMs: 0,
        distinctEntityCount: 0,
        windowSpanMs,
      };
    }

    let totalEvents = 0;
    let totalSuccess = 0;
    let durationSum = 0;
    const allUnique = new Set<string>();

    for (const [start, bucket] of categoryMap.entries()) {
      // Exclude buckets completely before the sliding window
      if (bucket.windowEndMs < minTimestamp) continue;
      // Exclude future buckets beyond now
      if (start > now) continue;

      totalEvents += bucket.eventsCount;
      totalSuccess += bucket.successCount;
      durationSum += bucket.durationSumMs;
      for (const entity of bucket.uniqueEntities) {
        allUnique.add(entity);
      }
    }

    const successRate = totalEvents > 0 ? (totalSuccess / totalEvents) * 100 : 100;
    const avgDuration = totalEvents > 0 ? durationSum / totalEvents : 0;

    return {
      totalEvents,
      successRatePercent: Math.round(successRate * 100) / 100,
      averageDurationMs: Math.round(avgDuration * 100) / 100,
      distinctEntityCount: allUnique.size,
      windowSpanMs,
    };
  }

  /**
   * Prunes obsolete buckets older than maxRetentionMs to guarantee strictly bounded memory.
   */
  public pruneExpiredBuckets(now: number, maxRetentionMs = 7 * 24 * 3600 * 1000): number {
    const cutoff = now - maxRetentionMs;
    let prunedCount = 0;

    for (const categoryMap of this.tumblingWindows.values()) {
      for (const [start, bucket] of categoryMap.entries()) {
        if (bucket.windowEndMs < cutoff) {
          categoryMap.delete(start);
          prunedCount++;
        }
      }
    }

    return prunedCount;
  }

  public clear(): void {
    this.tumblingWindows.clear();
  }
}
