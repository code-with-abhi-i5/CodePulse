import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlQueryCacheLayerService } from './api-int-22.service.ts';

describe('GraphqlQueryCacheLayerService (API-INT-22)', () => {
  it('stores cached query responses and supports tag-based selective invalidation', () => {
    const cache = new GraphqlQueryCacheLayerService();
    cache.set('hash-1', { challenge: { id: 10 } }, ['challenge', 'challenge:10'], 60000);
    cache.set('hash-2', { challenge: { id: 20 } }, ['challenge', 'challenge:20'], 60000);

    assert.notStrictEqual(cache.get('hash-1'), null);
    assert.notStrictEqual(cache.get('hash-2'), null);

    // Invalidate specifically challenge:10
    const count = cache.invalidateByTag('challenge:10');
    assert.strictEqual(count, 1);
    assert.strictEqual(cache.get('hash-1'), null);
    assert.notStrictEqual(cache.get('hash-2'), null);
  });
});
