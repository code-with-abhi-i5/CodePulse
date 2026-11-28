import { ClickhouseBatchBlock } from '../../types/db';

export class ClickhouseBatchInserterService {
  private buffer: Array<Record<string, unknown>> = [];
  private lastFlushTimestamp: number = Date.now();

  constructor(
    private readonly batchSizeThreshold: number = 1000,
    private readonly flushTimeoutMs: number = 2000
  ) {}

  public appendRow(row: Record<string, unknown>, now: number = Date.now()): ClickhouseBatchBlock | null {
    if (this.buffer.length === 0) {
      this.lastFlushTimestamp = now;
    }
    this.buffer.push(row);
    if (this.buffer.length >= this.batchSizeThreshold) {
      return this.flush('SIZE_THRESHOLD', now);
    }

    if (now - this.lastFlushTimestamp >= this.flushTimeoutMs && this.buffer.length > 0) {
      return this.flush('TIMEOUT_FLUSH', now);
    }

    return null;
  }

  public flush(reason: 'SIZE_THRESHOLD' | 'TIMEOUT_FLUSH', now: number = Date.now()): ClickhouseBatchBlock {
    const blockId = `block_${now}_${Math.floor(Math.random() * 10000)}`;
    const rows = [...this.buffer];
    this.buffer = [];
    this.lastFlushTimestamp = now;

    const coalescedPayload = rows.map(r => JSON.stringify(r)).join('\n');

    return {
      blockId,
      rowCount: rows.length,
      coalescedPayload,
      flushReason: reason
    };
  }

  public getBufferedCount(): number {
    return this.buffer.length;
  }
}
