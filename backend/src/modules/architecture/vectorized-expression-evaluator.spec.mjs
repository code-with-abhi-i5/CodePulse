import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { VectorizedExpressionEvaluatorService } from './vectorized-expression-evaluator.service.ts';

describe('VectorizedExpressionEvaluatorService [ARCH-CORE-034]', () => {
  const evaluator = new VectorizedExpressionEvaluatorService();

  test('evaluates numeric comparisons producing bitmask indices', () => {
    const scores = new Int32Array([10, 45, 90, 15, 80, 100, 30]);
    const mask = evaluator.evaluateNumericFilter(scores, 'GTE', 80);
    const indices = evaluator.toIndexList(mask);
    assert.deepEqual(indices, [2, 4, 5]); // 90, 80, 100
  });

  test('evaluates BETWEEN numeric range condition', () => {
    const ratings = new Float64Array([1200, 1450, 1600, 1900, 2100]);
    const mask = evaluator.evaluateNumericFilter(ratings, 'BETWEEN', 1400, 2000);
    const indices = evaluator.toIndexList(mask);
    assert.deepEqual(indices, [1, 2, 3]);
  });

  test('evaluates string IN filter and combines with AND', () => {
    const tiers = ['BRONZE', 'GOLD', 'PLATINUM', 'DIAMOND', 'GOLD'];
    const scores = new Int32Array([50, 200, 350, 500, 180]);

    const tierMask = evaluator.evaluateStringFilter(tiers, 'IN', ['GOLD', 'DIAMOND']);
    const scoreMask = evaluator.evaluateNumericFilter(scores, 'GT', 190);

    const combined = evaluator.bitwiseAnd(tierMask, scoreMask);
    const resultIndices = evaluator.toIndexList(combined);

    assert.deepEqual(resultIndices, [1, 3]); // GOLD (200), DIAMOND (500)
  });
});
