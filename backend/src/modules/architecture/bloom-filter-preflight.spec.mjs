import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BloomFilterPreflightFilter } from './bloom-filter-preflight.service.ts';

describe('BloomFilterPreflightFilter [ARCH-CORE-023]', () => {
  test('rejects non-existent keys with zero false negatives', () => {
    const filter = new BloomFilterPreflightFilter(100, 0.01);
    filter.add('sub_101');
    filter.add('sub_102');

    assert.equal(filter.mightContain('sub_101'), true);
    assert.equal(filter.mightContain('sub_102'), true);
    assert.equal(filter.mightContain('sub_9999_never_added'), false);
  });

  test('calculates optimal bit size and hash function count', () => {
    const filter = new BloomFilterPreflightFilter(500, 0.05);
    assert.ok(filter.getBitSize() > 500);
    assert.ok(filter.getHashCount() >= 3);
  });
});
