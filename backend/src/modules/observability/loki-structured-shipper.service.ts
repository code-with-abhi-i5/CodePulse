import { Injectable } from '@nestjs/common';
import { LokiBatchResult } from '../../types/observability';

@Injectable()
export class LokiStructuredShipperService {
  private buffer: Array<{ stream: Record<string, string>; line: string }> = [];
  private readonly maxBufferSize: number;
  private droppedCount = 0;

  constructor(maxBufferSize = 1000) {
    this.maxBufferSize = maxBufferSize;
  }

  pushLog(stream: Record<string, string>, line: string): boolean {
    if (this.buffer.length >= this.maxBufferSize) {
      this.droppedCount++;
      return false;
    }
    this.buffer.push({ stream, line });
    return true;
  }

  flush(): LokiBatchResult {
    const count = this.buffer.length;
    const dropped = this.droppedCount;

    let totalBytes = 0;
    const streamKeys = new Set<string>();

    for (const entry of this.buffer) {
      totalBytes += Buffer.byteLength(entry.line, 'utf8');
      streamKeys.add(JSON.stringify(entry.stream));
    }

    const compressedBytes = Math.round(totalBytes * 0.35);
    const occupancy = parseFloat(((count / this.maxBufferSize) * 100).toFixed(1));

    this.buffer = [];
    this.droppedCount = 0;

    return {
      streamsCount: streamKeys.size,
      totalLines: count,
      totalBytes,
      compressedBytes,
      droppedLines: dropped,
      bufferOccupancyPercent: occupancy
    };
  }

  getPendingCount(): number {
    return this.buffer.length;
  }
}
