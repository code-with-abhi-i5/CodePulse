import { Injectable } from '@nestjs/common';
import { BatchLimits } from '../../types/queues';

@Injectable()
export class MicroBatcherService {
  private buffer: any[] = [];
  private lastFlushEpoch: number = Date.now();
  private limits: BatchLimits = { maxSize: 100, maxIntervalMs: 500 };

  setBatchLimits(maxSize: number, maxIntervalMs: number): void {
    this.limits = { maxSize, maxIntervalMs };
  }

  pushRecord(record: any): void {
    this.buffer.push(record);
  }

  shouldFlush(nowMs: number = Date.now()): boolean {
    if (this.buffer.length >= this.limits.maxSize) return true;
    if (this.buffer.length > 0 && nowMs - this.lastFlushEpoch >= this.limits.maxIntervalMs) return true;
    return false;
  }

  flushBatch(): any[] {
    const batch = [...this.buffer];
    this.buffer = [];
    this.lastFlushEpoch = Date.now();
    return batch;
  }
}
