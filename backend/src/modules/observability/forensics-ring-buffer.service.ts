import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export interface TelemetrySnapshot {
  timestampMs: number;
  cpuUserUs: number;
  cpuSystemUs: number;
  heapUsedBytes: number;
  heapTotalBytes: number;
  rssBytes: number;
  activeHandles: number;
  activeRequests: number;
}

@Injectable()
export class ForensicsRingBufferService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ForensicsRingBufferService.name);

  // 300 seconds at 10 samples/sec (100ms) = 3000 snapshots
  public static readonly BUFFER_CAPACITY = 3000;
  private readonly snapshots: Array<TelemetrySnapshot | null> = new Array(ForensicsRingBufferService.BUFFER_CAPACITY).fill(null);
  private writePointer = 0;
  private isFull = false;
  private sampleTimer?: NodeJS.Timeout;
  private prevCpu = process.cpuUsage();

  onModuleInit() {
    this.startSampling(100);
  }

  onModuleDestroy() {
    this.stopSampling();
  }

  public startSampling(intervalMs = 100): void {
    if (this.sampleTimer) return;
    this.sampleTimer = setInterval(() => this.captureSnapshot(), intervalMs);
    if (this.sampleTimer.unref) {
      this.sampleTimer.unref();
    }
  }

  public stopSampling(): void {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer);
      this.sampleTimer = undefined;
    }
  }

  /**
   * Captures a single 100ms telemetry slice into the circular ring buffer.
   */
  public captureSnapshot(customTimestamp?: number): TelemetrySnapshot {
    const mem = process.memoryUsage();
    const curCpu = process.cpuUsage(this.prevCpu);
    this.prevCpu = process.cpuUsage();

    const snapshot: TelemetrySnapshot = {
      timestampMs: customTimestamp ?? Date.now(),
      cpuUserUs: curCpu.user,
      cpuSystemUs: curCpu.system,
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      rssBytes: mem.rss,
      activeHandles: (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0,
      activeRequests: (process as any)._getActiveRequests ? (process as any)._getActiveRequests().length : 0,
    };

    this.snapshots[this.writePointer] = snapshot;
    this.writePointer = (this.writePointer + 1) % ForensicsRingBufferService.BUFFER_CAPACITY;
    if (this.writePointer === 0) {
      this.isFull = true;
    }

    return snapshot;
  }

  /**
   * Returns chronologically ordered snapshots covering up to the last 300 seconds.
   */
  public getFlightRecorderData(): TelemetrySnapshot[] {
    const result: TelemetrySnapshot[] = [];

    if (!this.isFull) {
      for (let i = 0; i < this.writePointer; i++) {
        if (this.snapshots[i]) result.push(this.snapshots[i]!);
      }
    } else {
      // From oldest (writePointer) to newest
      for (let i = 0; i < ForensicsRingBufferService.BUFFER_CAPACITY; i++) {
        const idx = (this.writePointer + i) % ForensicsRingBufferService.BUFFER_CAPACITY;
        if (this.snapshots[idx]) result.push(this.snapshots[idx]!);
      }
    }

    return result;
  }

  public getSnapshotCount(): number {
    return this.isFull ? ForensicsRingBufferService.BUFFER_CAPACITY : this.writePointer;
  }
}
