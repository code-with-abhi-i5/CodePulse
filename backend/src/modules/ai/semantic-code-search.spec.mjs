import test from 'node:test';
import assert from 'node:assert/strict';

class SemanticCodeSearchService {
  constructor() {
    this.functions = [];
  }

  indexFunction(name, embedding, snippet) {
    this.functions.push({ name, embedding, snippet });
  }

  search(queryEmbedding, limit = 3) {
    const results = this.functions.map(fn => {
      let dot = 0, magA = 0, magB = 0;
      for (let i = 0; i < queryEmbedding.length; i++) {
        dot += queryEmbedding[i] * fn.embedding[i];
        magA += queryEmbedding[i] * queryEmbedding[i];
        magB += fn.embedding[i] * fn.embedding[i];
      }
      const score = Math.sqrt(magA) * Math.sqrt(magB) === 0 ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
      return { functionName: fn.name, similarityScore: Math.round(score * 1000) / 1000, snippet: fn.snippet };
    });
    return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit);
  }
}

test('SemanticCodeSearchService - ranks matching functions by embedding cosine similarity', () => {
  const service = new SemanticCodeSearchService();
  service.indexFunction('parseDate', [1, 0, 0], 'function parseDate() {}');
  service.indexFunction('sortList', [0, 1, 0], 'function sortList() {}');

  const matches = service.search([0.95, 0.1, 0], 1);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].functionName, 'parseDate');
});
