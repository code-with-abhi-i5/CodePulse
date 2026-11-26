import test from 'node:test';
import assert from 'node:assert/strict';

class SemanticResponseCacheService {
  constructor() {
    this.cache = [];
    this.similarityThreshold = 0.90;
  }

  set(query, embedding, response) {
    this.cache.push({ query, embedding, response, hitCount: 0, timestamp: Date.now() });
  }

  get(queryEmbedding) {
    let bestScore = -1;
    let bestEntry;

    for (const entry of this.cache) {
      const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore >= this.similarityThreshold) {
      bestEntry.hitCount++;
      return { isHit: true, similarity: Math.round(bestScore * 1000) / 1000, cachedResponse: bestEntry.response };
    }

    return { isHit: false, similarity: Math.max(0, Math.round(bestScore * 1000) / 1000) };
  }

  cosineSimilarity(a, b) {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }
}

test('SemanticResponseCacheService - matches high cosine similarity cache hits', () => {
  const service = new SemanticResponseCacheService();
  service.set('What is quicksort?', [1, 0, 0], 'Quicksort is a divide and conquer algorithm.');

  const hit = service.get([0.98, 0.05, 0]);
  assert.equal(hit.isHit, true);
  assert.ok(hit.similarity >= 0.90);
  assert.equal(hit.cachedResponse, 'Quicksort is a divide and conquer algorithm.');

  const miss = service.get([0, 1, 0]);
  assert.equal(miss.isHit, false);
});
