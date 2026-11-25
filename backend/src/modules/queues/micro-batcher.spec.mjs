import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MicroBatcherService {
  constructor() {
    this.buffer = [];
    this.lastFlushEpoch = Date.now();
    this.limits = { maxSize: 100, maxIntervalMs: 500 };
  }

  setBatchLimits(maxSize, maxIntervalMs) {
    this.limits = { maxSize, maxIntervalMs };
  }

  pushRecord(record) {
    this.buffer.push(record);
  }

  shouldFlush(nowMs = Date.now()) {
    if (this.buffer.length >= this.limits.maxSize) return true;
    if (this.buffer.length > 0 && nowMs - this.lastFlushEpoch >= this.limits.maxIntervalMs) return true;
    return false;
  }

  flushBatch() {
    const batch = [...this.buffer];
    this.buffer = [];
    this.lastFlushEpoch = Date.now();
    return batch;
  }
}

describe('MicroBatcherService', () => {
  it('buffers and flushes bulk records based on size and interval thresholds', () => {
    const service = new MicroBatcherService();
    service.setBatchLimits(3, 1000);
    service.pushRecord({ metric: 'cpu', val: 40 });
    service.pushRecord({ metric: 'mem', val: 60 });
    assert.equal(service.shouldFlush(Date.now()), false);

    service.pushRecord({ metric: 'io', val: 80 });
    assert.equal(service.shouldFlush(Date.now()), true);

    const flushed = service.flushBatch();
    assert.equal(flushed.length, 3);
    assert.equal(service.flushBatch().length, 0);
  });
});
