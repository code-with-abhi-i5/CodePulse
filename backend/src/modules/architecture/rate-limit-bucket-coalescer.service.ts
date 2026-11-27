export interface FlushReport {
  flushedKeys: number;
  totalIncrements: number;
  durationMs: number;
}

export class DistributedRateLimitBucketCoalescer {
  private buffer = new Map<string, number>();
  private maxBatchSize: number;
  private maxWaitMs: number;
  private timer: NodeJS.Timeout | null = null;
  private onFlushCallback?: (batch: Map<string, number>) => Promise<void> | void;

  constructor(maxBatchSize = 100, maxWaitMs = 100, onFlush?: (batch: Map<string, number>) => Promise<void> | void) {
    this.maxBatchSize = maxBatchSize;
    this.maxWaitMs = maxWaitMs;
    this.onFlushCallback = onFlush;
  }

  public increment(key: string, delta = 1): void {
    const current = this.buffer.get(key) || 0;
    this.buffer.set(key, current + delta);

    if (this.buffer.size >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.flush();
      }, this.maxWaitMs);
    }
  }

  public async flush(): Promise<FlushReport> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.buffer.size === 0) {
      return { flushedKeys: 0, totalIncrements: 0, durationMs: 0 };
    }

    const start = Date.now();
    const batch = new Map(this.buffer);
    this.buffer.clear();

    let totalIncrements = 0;
    for (const v of batch.values()) totalIncrements += v;

    if (this.onFlushCallback) {
      await this.onFlushCallback(batch);
    }

    return {
      flushedKeys: batch.size,
      totalIncrements,
      durationMs: Date.now() - start
    };
  }

  public getBufferedCount(key: string): number {
    return this.buffer.get(key) || 0;
  }

  public getBufferSize(): number {
    return this.buffer.size;
  }
}
