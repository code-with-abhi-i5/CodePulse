import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class CacheStampedeMitigatorService {
  constructor(beta = 1.0) {
    this.beta = beta;
  }

  shouldRecomputeEarly(ttlRemainingMs, computationDeltaMs, randomValue = Math.random()) {
    if (ttlRemainingMs <= 0) {
      return true;
    }
    const rand = Math.max(randomValue, 1e-10);
    const threshold = -this.beta * computationDeltaMs * Math.log(rand);
    return threshold > ttlRemainingMs;
  }

  evaluateCacheEntry(cachedValue, expiryTimestamp, computationDeltaMs, now = Date.now(), randomValue = Math.random()) {
    const ttlRemainingMs = expiryTimestamp - now;
    const needsEarlyRecomputation = this.shouldRecomputeEarly(ttlRemainingMs, computationDeltaMs, randomValue);

    return {
      value: cachedValue,
      needsEarlyRecomputation,
      ttlRemainingMs: Math.max(0, ttlRemainingMs)
    };
  }
}

describe('CacheStampedeMitigatorService', () => {
  const mitigator = new CacheStampedeMitigatorService(1.0);

  it('triggers immediate recomputation when TTL is zero or expired', () => {
    assert.equal(mitigator.shouldRecomputeEarly(0, 100), true);
    assert.equal(mitigator.shouldRecomputeEarly(-50, 100), true);
  });

  it('probabilistically flags early recomputation before hard TTL expiration', () => {
    // If delta is 5000ms, and ttlRemaining is 1000ms, a low random value (e.g. 0.05) produces -5000 * ln(0.05) ~ 14978 > 1000
    const needsEarly = mitigator.shouldRecomputeEarly(1000, 5000, 0.05);
    assert.equal(needsEarly, true);

    // If ttlRemaining is very large (e.g. 100000ms) with high random value, it will not recompute early
    const noNeed = mitigator.shouldRecomputeEarly(100000, 100, 0.9);
    assert.equal(noNeed, false);
  });

  it('evaluates cache entry and returns typed XFetchResult', () => {
    const now = 1000;
    const expiry = 5000;
    const res = mitigator.evaluateCacheEntry({ data: 'fast' }, expiry, 100, now, 0.99);
    assert.equal(res.value.data, 'fast');
    assert.equal(res.ttlRemainingMs, 4000);
    assert.equal(res.needsEarlyRecomputation, false);
  });
});
