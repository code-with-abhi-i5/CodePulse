import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ClickhouseBatchInserterService {
  constructor(batchSizeThreshold = 1000, flushTimeoutMs = 2000) {
    this.batchSizeThreshold = batchSizeThreshold;
    this.flushTimeoutMs = flushTimeoutMs;
    this.buffer = [];
    this.lastFlushTimestamp = Date.now();
  }

  appendRow(row, now = Date.now()) {
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

  flush(reason, now = Date.now()) {
    const blockId = 'block_' + now + '_' + Math.floor(Math.random() * 10000);
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

  getBufferedCount() {
    return this.buffer.length;
  }
}

describe('ClickhouseBatchInserterService', () => {
  it('buffers telemetry items until size threshold is satisfied', () => {
    const inserter = new ClickhouseBatchInserterService(3, 10000);
    const b1 = inserter.appendRow({ event: 'ping' });
    assert.equal(b1, null);
    assert.equal(inserter.getBufferedCount(), 1);

    inserter.appendRow({ event: 'run' });
    const b3 = inserter.appendRow({ event: 'done' });
    assert.ok(b3);
    assert.equal(b3.rowCount, 3);
    assert.equal(b3.flushReason, 'SIZE_THRESHOLD');
    assert.equal(inserter.getBufferedCount(), 0);
  });

  it('triggers timeout flush when buffer has pending items past deadline', () => {
    const inserter = new ClickhouseBatchInserterService(10, 1000);
    inserter.appendRow({ event: 'single' }, 1000);

    const flushed = inserter.appendRow({ event: 'second' }, 3000);
    assert.ok(flushed);
    assert.equal(flushed.flushReason, 'TIMEOUT_FLUSH');
    assert.equal(flushed.rowCount, 2);
  });
});
