import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class LokiStructuredShipperService {
  constructor(maxBufferSize = 1000) {
    this.buffer = [];
    this.maxBufferSize = maxBufferSize;
    this.droppedCount = 0;
  }

  pushLog(stream, line) {
    if (this.buffer.length >= this.maxBufferSize) {
      this.droppedCount++;
      return false;
    }
    this.buffer.push({ stream, line });
    return true;
  }

  flush() {
    const count = this.buffer.length;
    const dropped = this.droppedCount;
    let totalBytes = 0;
    const streamKeys = new Set();
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

  getPendingCount() {
    return this.buffer.length;
  }
}

describe('LokiStructuredShipperService', () => {
  it('buffers structured logs and applies backpressure when buffer capacity is reached', () => {
    const shipper = new LokiStructuredShipperService(5);
    for (let i = 0; i < 5; i++) {
      const accepted = shipper.pushLog({ app: 'codepulse', env: 'prod' }, `log line ${i}`);
      assert.strictEqual(accepted, true);
    }

    const rejected = shipper.pushLog({ app: 'codepulse', env: 'prod' }, 'log line 6 overflow');
    assert.strictEqual(rejected, false);

    const batch = shipper.flush();
    assert.strictEqual(batch.totalLines, 5);
    assert.strictEqual(batch.droppedLines, 1);
    assert.strictEqual(batch.streamsCount, 1);
    assert.ok(batch.compressedBytes < batch.totalBytes);
    assert.strictEqual(shipper.getPendingCount(), 0);
  });
});
