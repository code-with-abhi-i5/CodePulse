import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PerformanceObserver, constants as perfConstants, monitorEventLoopDelay, IntervalHistogram } from 'perf_hooks';

export type GcType = 'SCAVENGE' | 'MARK_SWEEP' | 'INCREMENTAL' | 'WEAK_CALLBACK' | 'UNKNOWN';

export interface GcEventRecord {
  timestampMs: number;
  durationMs: number;
  type: GcType;
  flags?: number;
  heapUsedBeforeMb?: number;
  heapUsedAfterMb?: number;
}

@Injectable()
export class PerfHooksMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PerfHooksMonitorService.name);
  private gcObserver?: PerformanceObserver;
  private eventLoopHistogram?: IntervalHistogram;
  private readonly gcHistory: GcEventRecord[] = [];
  private readonly MAX_HISTORY = 1000;

  onModuleInit() {
    this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  public startMonitoring(): void {
    try {
      this.eventLoopHistogram = monitorEventLoopDelay({ resolution: 10 });
      this.eventLoopHistogram.enable();
    } catch {
      // Event loop delay monitor fallback
    }

    try {
      this.gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const detail = (entry as any).detail;
          const kind = detail ? detail.kind : 0;

          let type: GcType = 'UNKNOWN';
          if (kind === perfConstants.NODE_PERFORMANCE_GC_MINOR) {
            type = 'SCAVENGE';
          } else if (kind === perfConstants.NODE_PERFORMANCE_GC_MAJOR) {
            type = 'MARK_SWEEP';
          } else if (kind === perfConstants.NODE_PERFORMANCE_GC_INCREMENTAL) {
            type = 'INCREMENTAL';
          } else if (kind === perfConstants.NODE_PERFORMANCE_GC_WEAKCB) {
            type = 'WEAK_CALLBACK';
          }

          this.recordGcEvent({
            timestampMs: Date.now(),
            durationMs: entry.duration,
            type,
            flags: detail ? detail.flags : undefined,
          });
        }
      });

      this.gcObserver.observe({ entryTypes: ['gc'] });
      this.logger.log('V8 Garbage Collection performance observer active');
    } catch (err: any) {
      this.logger.warn(`Could not initialize GC performance observer: ${err?.message}`);
    }
  }

  public stopMonitoring(): void {
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }
    if (this.eventLoopHistogram) {
      this.eventLoopHistogram.disable();
    }
  }

  public recordGcEvent(event: GcEventRecord): void {
    this.gcHistory.push(event);
    if (this.gcHistory.length > this.MAX_HISTORY) {
      this.gcHistory.shift();
    }
  }

  public getRecentGcEvents(limit = 100): GcEventRecord[] {
    return this.gcHistory.slice(-limit);
  }

  public getEventLoopLagMs(): { min: number; max: number; mean: number; p50: number; p95: number; p99: number } {
    if (!this.eventLoopHistogram) {
      return { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
    }

    return {
      min: Number(this.eventLoopHistogram.min) / 1_000_000,
      max: Number(this.eventLoopHistogram.max) / 1_000_000,
      mean: Number(this.eventLoopHistogram.mean) / 1_000_000,
      p50: Number(this.eventLoopHistogram.percentile(50)) / 1_000_000,
      p95: Number(this.eventLoopHistogram.percentile(95)) / 1_000_000,
      p99: Number(this.eventLoopHistogram.percentile(99)) / 1_000_000,
    };
  }
}
