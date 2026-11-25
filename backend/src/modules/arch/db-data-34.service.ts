/**
 * Architecture Service: ClickHouse Ingestion Buffer Flushing Manager
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-34]
 */

export class ClickHouseIngestionBufferManagerService<T> {
  private buffer: T[];
  private maxBufferSize: number;
  private maxBufferAgeMs: number;
  private lastFlushTimestamp: number;

  constructor(maxBufferSize: number = 1000, maxBufferAgeMs: number = 2000) {
    this.buffer = [];
    this.maxBufferSize = maxBufferSize;
    this.maxBufferAgeMs = maxBufferAgeMs;
    this.lastFlushTimestamp = Date.now();
  }

  public push(item: T): boolean {
    this.buffer.push(item);
    return this.shouldFlush();
  }

  public shouldFlush(now: number = Date.now()): boolean {
    if (this.buffer.length >= this.maxBufferSize) return true;
    if (this.buffer.length > 0 && now - this.lastFlushTimestamp >= this.maxBufferAgeMs) return true;
    return false;
  }

  public flush(): T[] {
    const batch = this.buffer;
    this.buffer = [];
    this.lastFlushTimestamp = Date.now();
    return batch;
  }

  public get pendingCount(): number {
    return this.buffer.length;
  }
}
