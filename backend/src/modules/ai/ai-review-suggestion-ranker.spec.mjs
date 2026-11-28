import test from 'node:test';
import assert from 'node:assert/strict';

class AiReviewSuggestionRankerService {
  rankSuggestions(suggestions) {
    const categoryWeights = { security: 100, bug: 75, performance: 50, style: 25 };
    const scored = [...suggestions].sort((a, b) => {
      const scoreA = (categoryWeights[a.category] || 10) * a.confidenceScore;
      const scoreB = (categoryWeights[b.category] || 10) * b.confidenceScore;
      return scoreB - scoreA;
    });
    return {
      suggestions: scored.map((s, idx) => ({ ...s, rank: idx + 1 })),
      highestPriorityCategory: scored.length > 0 ? scored[0].category : 'none'
    };
  }
}

test('AiReviewSuggestionRankerService - prioritizes security comments over style comments', () => {
  const service = new AiReviewSuggestionRankerService();
  const items = [
    { id: '1', category: 'style', confidenceScore: 0.99, line: 10, message: 'use single quotes' },
    { id: '2', category: 'security', confidenceScore: 0.85, line: 25, message: 'sql injection risk' }
  ];
  const res = service.rankSuggestions(items);

  assert.equal(res.suggestions[0].category, 'security');
  assert.equal(res.highestPriorityCategory, 'security');
});
