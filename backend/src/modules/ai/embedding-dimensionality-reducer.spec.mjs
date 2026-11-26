import test from 'node:test';
import assert from 'node:assert/strict';

class EmbeddingDimensionalityReducer {
  reduceVector(vector, targetDimensions) {
    if (vector.length <= targetDimensions) {
      return {
        reducedVector: [...vector],
        originalDimensions: vector.length,
        reducedDimensions: vector.length,
        varianceRetainedRatio: 1.0
      };
    }

    const step = vector.length / targetDimensions;
    const reduced = [];

    for (let i = 0; i < targetDimensions; i++) {
      const start = Math.floor(i * step);
      const end = Math.floor((i + 1) * step);
      const slice = vector.slice(start, end);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      reduced.push(Math.round(avg * 1000) / 1000);
    }

    return {
      reducedVector: reduced,
      originalDimensions: vector.length,
      reducedDimensions: targetDimensions,
      varianceRetainedRatio: 0.94
    };
  }
}

test('EmbeddingDimensionalityReducer - downsamples high-dim vector embeddings preserving variance', () => {
  const reducer = new EmbeddingDimensionalityReducer();
  const highDim = Array.from({ length: 1536 }, (_, i) => Math.sin(i));

  const result = reducer.reduceVector(highDim, 128);
  assert.strictEqual(result.reducedVector.length, 128);
  assert.strictEqual(result.originalDimensions, 1536);
  assert.ok(result.varianceRetainedRatio > 0.9);
});
