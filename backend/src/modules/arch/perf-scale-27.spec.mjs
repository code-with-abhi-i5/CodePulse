import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HighConcurrencyTokenBucketService } from './perf-scale-27.service.ts';

describe('HighConcurrencyTokenBucketService (PERF-SCALE-27)', () => {
  it('allows consumption within token bucket capacity', () => {
    const bucket = new HighConcurrencyTokenBucketService(5, 1);
    const r1 = bucket.tryConsume(3);
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remainingTokens, 2);

    const r2 = bucket.tryConsume(3);
    assert.strictEqual(r2.allowed, false);
    assert.ok(r2.waitTimeMs > 0);
  });

  it('refills tokens over time accurately', () => {
    const bucket = new HighConcurrencyTokenBucketService(5, 2);
    bucket.tryConsume(5, 1000); // Empty

    // 1 second later: 2 tokens refilled
    const r = bucket.tryConsume(2, 2000);
    assert.strictEqual(r.allowed, true);
  });
});
