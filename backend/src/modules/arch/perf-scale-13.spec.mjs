import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProbabilisticXFetchCacheService } from './perf-scale-13.service.ts';

describe('ProbabilisticXFetchCacheService (PERF-SCALE-13)', () => {
  it('serves cached value and triggers early refresh when approaching TTL', () => {
    const cache = new ProbabilisticXFetchCacheService(1.0);
    const ttl = 1000;
    const delta = 100;
    cache.set('top-rankings', [1, 2, 3], ttl, delta);

    // Initial read shortly after set
    const res1 = cache.get('top-rankings', Date.now() + 10, 0.5);
    assert.strictEqual(res1.needsRefresh, false);
    assert.deepStrictEqual(res1.value, [1, 2, 3]);

    // Near expiration
    const res2 = cache.get('top-rankings', Date.now() + 980, 0.5);
    assert.strictEqual(res2.needsRefresh, true);
  });
});
