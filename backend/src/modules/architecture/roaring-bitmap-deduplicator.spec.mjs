import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RoaringBitmapDeduplicator } from './roaring-bitmap-deduplicator.service.ts';

describe('RoaringBitmapDeduplicator [ARCH-CORE-014]', () => {
  test('deduplicates integer message IDs efficiently', () => {
    const dedup = new RoaringBitmapDeduplicator();
    assert.equal(dedup.add(100), true);
    assert.equal(dedup.add(100), false);
    assert.equal(dedup.contains(100), true);
    assert.equal(dedup.contains(101), false);

    // Large ID spanning higher 16-bit container
    assert.equal(dedup.add(0x10005), true);
    assert.equal(dedup.contains(0x10005), true);
    assert.equal(dedup.cardinality(), 2);
  });
});
