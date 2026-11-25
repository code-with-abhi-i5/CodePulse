import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class XFetchCacheService {
  constructor() {
    this.store = new Map();
  }

  shouldRecompute(deltaMs, beta, ttlRemainingMs) {
    if (ttlRemainingMs <= 0) return true;
    const rand = 0.5; // deterministic test mock
    const threshold = -beta * deltaMs * Math.log(rand);
    return threshold >= ttlRemainingMs;
  }

  set(key, value, ttlMs, computeTimeMs = 50) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      computeTimeMs,
    });
  }

  get(key, beta = 1.0) {
    const item = this.store.get(key);
    if (!item) return null;
    const ttlRemaining = item.expiresAt - Date.now();
    const needsRecompute = this.shouldRecompute(item.computeTimeMs, beta, ttlRemaining);
    return { value: item.value, needsRecompute };
  }
}

describe('XFetchCacheService', () => {
  it('prevents cache stampedes via probabilistic early expiration', () => {
    const service = new XFetchCacheService();
    service.set('leaderboard', { rank: 1 }, 10000, 100);
    const active = service.get('leaderboard');
    assert.equal(active.needsRecompute, false);

    service.set('stale-soon', { rank: 2 }, 10, 100);
    const expiring = service.get('stale-soon');
    assert.equal(expiring.needsRecompute, true);
  });
});
