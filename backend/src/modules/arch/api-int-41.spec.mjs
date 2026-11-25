import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GraphqlApqCacheService } from './api-int-41.service.ts';

describe('GraphqlApqCacheService (API-INT-41)', () => {
  it('implements LRU caching for automatic persisted queries', () => {
    const cache = new GraphqlApqCacheService(2);
    cache.set('h1', 'query Q1');
    cache.set('h2', 'query Q2');

    assert.strictEqual(cache.get('h1'), 'query Q1');
    // Adding h3 evicts least recently accessed (h2 was not accessed)
    cache.set('h3', 'query Q3');

    assert.strictEqual(cache.get('h1'), 'query Q1');
    assert.strictEqual(cache.get('h2'), null);
    assert.strictEqual(cache.get('h3'), 'query Q3');
  });
});
