import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedRateLimitBucketCoalescer } from './rate-limit-bucket-coalescer.service.ts';

describe('DistributedRateLimitBucketCoalescer [ARCH-CORE-028]', () => {
  test('coalesces increments in memory before manual flush', async () => {
    let flushedCount = 0;
    const coalescer = new DistributedRateLimitBucketCoalescer(50, 1000, batch => {
      flushedCount = batch.get('user_10') || 0;
    });

    coalescer.increment('user_10', 3);
    coalescer.increment('user_10', 7);
    assert.equal(coalescer.getBufferedCount('user_10'), 10);

    const report = await coalescer.flush();
    assert.equal(report.flushedKeys, 1);
    assert.equal(report.totalIncrements, 10);
    assert.equal(flushedCount, 10);
    assert.equal(coalescer.getBufferedCount('user_10'), 0);
  });

  test('triggers flush automatically when max batch size reached', async () => {
    let batchFlushed = false;
    const coalescer = new DistributedRateLimitBucketCoalescer(3, 1000, () => {
      batchFlushed = true;
    });

    coalescer.increment('key1', 1);
    coalescer.increment('key2', 1);
    assert.equal(batchFlushed, false);

    coalescer.increment('key3', 1); // 3rd unique key triggers maxBatchSize
    assert.equal(batchFlushed, true);
  });
});
