import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BTree2QPageCacheManager } from './btree-2q-page-cache.service.ts';

describe('BTree2QPageCacheManager [ARCH-CORE-030]', () => {
  test('admits fresh pages into A1in queue and evicts to A1out ghost cache', () => {
    const cache = new BTree2QPageCacheManager(4); // kin=1, kout=2, am=3
    cache.put('page_1', 'data_1');
    assert.equal(cache.get('page_1'), 'data_1');

    // Second page causes page_1 to be pushed to A1out ghost cache
    cache.put('page_2', 'data_2');
    assert.equal(cache.get('page_2'), 'data_2');
    assert.equal(cache.get('page_1'), undefined); // page_1 data evicted, but key in ghost cache
  });

  test('promotes recurring page from A1out ghost cache directly to Am LRU pool', () => {
    const cache = new BTree2QPageCacheManager(4);
    cache.put('page_A', 'A');
    cache.put('page_B', 'B'); // page_A pushed to A1out

    // Re-accessing page_A should promote it to Am
    cache.put('page_A', 'A_renewed');
    const stats = cache.getStats();
    assert.equal(stats.amSize, 1);
    assert.equal(cache.get('page_A'), 'A_renewed');
  });

  test('tracks hits and misses accurately', () => {
    const cache = new BTree2QPageCacheManager(10);
    cache.put('p1', 'val');
    cache.get('p1'); // hit
    cache.get('p2'); // miss
    const stats = cache.getStats();
    assert.equal(stats.hits, 1);
    assert.equal(stats.misses, 1);
  });
});
