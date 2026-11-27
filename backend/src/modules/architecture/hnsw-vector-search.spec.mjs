import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { HNSWVectorSearchEngine } from './hnsw-vector-search.service.ts';

describe('HNSWVectorSearchEngine [ARCH-CORE-008]', () => {
  test('indexes vectors and performs k-nearest neighbor similarity search', () => {
    const hnsw = new HNSWVectorSearchEngine();
    hnsw.add('doc_ai', [1.0, 0.9, 0.1]);
    hnsw.add('doc_ml', [0.95, 0.85, 0.15]);
    hnsw.add('doc_cooking', [0.0, 0.1, 0.95]);

    const results = hnsw.searchKnn([1.0, 0.9, 0.0], 2);
    assert.equal(results.length, 2);
    assert.equal(results[0].id, 'doc_ai');
    assert.equal(results[1].id, 'doc_ml');
    assert.ok(results[0].score > 0.98);
  });
});
