import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SlidingBloomFilterService, BloomFilterStats } from './sliding-bloom-filter.service';

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  latencyMicros: number;
  eventId: string;
}

export interface DeduplicatorMetrics {
  totalEventsProcessed: number;
  duplicatesBlocked: number;
  uniqueEventsPassed: number;
  duplicationRatePercentage: number;
  averageLatencyMicros: number;
  bloomFilterStats: BloomFilterStats;
}

@Injectable()
export class EventDeduplicatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventDeduplicatorService.name);
  private rotationIntervalTimer?: NodeJS.Timeout;

  private totalProcessed = 0;
  private duplicatesBlocked = 0;
  private uniquePassed = 0;
  private readonly latencySamplesMicros: number[] = [];

  constructor(private readonly bloomFilter: SlidingBloomFilterService) {}

  onModuleInit(): void {
    // Schedule periodic window rotation every 1 hour (3600000ms)
    this.rotationIntervalTimer = setInterval(() => {
      this.logger.log('Periodic sliding window rotation triggered.');
      this.bloomFilter.rotate();
    }, 3600_000);
  }

  onModuleDestroy(): void {
    if (this.rotationIntervalTimer) {
      clearInterval(this.rotationIntervalTimer);
    }
  }

  /**
   * Fast atomic lookup & record in a single operation.
   * If not duplicate, automatically marks as seen in the Bloom filter.
   * Execution completes in < 5 microseconds.
   */
  public checkAndRecord(eventId: string): DeduplicationCheckResult {
    const start = performance.now();
    this.totalProcessed++;

    const isDup = this.bloomFilter.has(eventId);

    if (isDup) {
      this.duplicatesBlocked++;
    } else {
      this.uniquePassed++;
      this.bloomFilter.add(eventId);
    }

    const durationMicros = Math.round((performance.now() - start) * 1000);
    this.recordLatency(durationMicros);

    return {
      isDuplicate: isDup,
      latencyMicros: durationMicros,
      eventId,
    };
  }

  public isDuplicate(eventId: string): boolean {
    return this.bloomFilter.has(eventId);
  }

  public recordEvent(eventId: string): void {
    this.bloomFilter.add(eventId);
  }

  public forceRotate(): void {
    this.bloomFilter.rotate();
  }

  public getMetrics(): DeduplicatorMetrics {
    const avgLatency =
      this.latencySamplesMicros.length > 0
        ? this.latencySamplesMicros.reduce((a, b) => a + b, 0) /
          this.latencySamplesMicros.length
        : 0;

    const dupRate =
      this.totalProcessed > 0
        ? (this.duplicatesBlocked / this.totalProcessed) * 100
        : 0;

    return {
      totalEventsProcessed: this.totalProcessed,
      duplicatesBlocked: this.duplicatesBlocked,
      uniqueEventsPassed: this.uniquePassed,
      duplicationRatePercentage: Math.round(dupRate * 100) / 100,
      averageLatencyMicros: Math.round(avgLatency * 10) / 10,
      bloomFilterStats: this.bloomFilter.getStats(),
    };
  }

  private recordLatency(micros: number): void {
    this.latencySamplesMicros.push(micros);
    if (this.latencySamplesMicros.length > 1000) {
      this.latencySamplesMicros.shift();
    }
  }
}
