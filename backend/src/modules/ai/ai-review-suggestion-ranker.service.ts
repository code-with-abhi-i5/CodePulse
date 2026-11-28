import { RankedReviewSuggestions, ReviewSuggestion } from '../../types/ai';

export class AiReviewSuggestionRankerService {
  rankSuggestions(suggestions: ReviewSuggestion[]): RankedReviewSuggestions {
    const categoryWeights: Record<string, number> = {
      'security': 100,
      'bug': 75,
      'performance': 50,
      'style': 25
    };

    const scored = [...suggestions].sort((a, b) => {
      const scoreA = (categoryWeights[a.category] || 10) * a.confidenceScore;
      const scoreB = (categoryWeights[b.category] || 10) * b.confidenceScore;
      return scoreB - scoreA;
    });

    const ranked = scored.map((s, idx) => ({ ...s, rank: idx + 1 }));
    const highestPriority = ranked.length > 0 ? ranked[0].category : 'none';

    return {
      suggestions: ranked,
      highestPriorityCategory: highestPriority
    };
  }
}
