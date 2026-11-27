import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HyperLogLogEstimator } from './hyperloglog-estimator.service.ts';

describe('HyperLogLogEstimator [ARCH-CORE-040]', () => {
  test('estimates distinct counts with low error within expected precision', () => {
    const hll = new HyperLogLogEstimator({ precision: 10 }); // 1024 registers
    assert.equal(hll.estimate(), 0);

    const items = 500;
    for (let i = 0; i < items; i++) {
      hll.add(`user_${i}`);
    }

    const est = hll.estimate();
    // Expected relative standard error for p=10 is ~1.04 / sqrt(1024) = 3.25%
    const error = Math.abs(est - items) / items;
    assert.ok(error < 0.1, `Estimate ${est} error ${error} is within 10%`);
  });

  test('deduplicates repetitive insertions without inflating estimate', () => {
    const hll = new HyperLogLogEstimator({ precision: 8 });
    for (let i = 0; i < 200; i++) {
      hll.add('fixed_challenger_id');
    }
    const est = hll.estimate();
    assert.ok(est >= 1 && est <= 3, `Expected estimate near 1, got ${est}`);
  });

  test('merges two estimators correctly into union estimate', () => {
    const hll1 = new HyperLogLogEstimator({ precision: 10 });
    const hll2 = new HyperLogLogEstimator({ precision: 10 });

    for (let i = 0; i < 250; i++) hll1.add(`id_${i}`);
    for (let i = 200; i < 450; i++) hll2.add(`id_${i}`); // 50 items overlap, total unique = 450

    hll1.merge(hll2);
    const est = hll1.estimate();
    const error = Math.abs(est - 450) / 450;
    assert.ok(error < 0.12, `Merged estimate ${est} error ${error} within bounds`);
  });

  test('throws when merging mismatched precisions', () => {
    const hll1 = new HyperLogLogEstimator({ precision: 8 });
    const hll2 = new HyperLogLogEstimator({ precision: 10 });
    assert.throws(() => hll1.merge(hll2), /Cannot merge HyperLogLog with different precisions/);
  });
});
