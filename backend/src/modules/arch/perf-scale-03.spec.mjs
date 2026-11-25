import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MultiLayerCacheCoordinatorService } from './perf-scale-03.service.ts';

describe('MultiLayerCacheCoordinatorService (PERF-SCALE-03)', () => {
  it('serves from L1 and falls back to L2 with automatic promotion', () => {
    const cache = new MultiLayerCacheCoordinatorService(2);
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');

    // L1 hit
    assert.deepStrictEqual(cache.get('k1'), { value: 'v1', source: 'L1' });

    // Insert 3rd key, evicts LFU from L1
    cache.set('k3', 'v3');

    // k2 should be evicted from L1 to L2
    const resK2 = cache.get('k2');
    assert.deepStrictEqual(resK2, { value: 'v2', source: 'L2' });

    // Now k2 is promoted back to L1
    assert.deepStrictEqual(cache.get('k2'), { value: 'v2', source: 'L1' });
  });

  it('invalidates key across both tiers simultaneously', () => {
    const cache = new MultiLayerCacheCoordinatorService();
    cache.set('user:1', 'Alice');
    cache.invalidate('user:1');
    assert.strictEqual(cache.get('user:1').source, 'MISS');
  });
});
