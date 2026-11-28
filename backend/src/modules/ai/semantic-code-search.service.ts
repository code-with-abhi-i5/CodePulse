import { SemanticSearchResult } from '../../types/ai';

export class SemanticCodeSearchService {
  private functions: Array<{ name: string; embedding: number[]; snippet: string }> = [];

  indexFunction(name: string, embedding: number[], snippet: string): void {
    this.functions.push({ name, embedding, snippet });
  }

  search(queryEmbedding: number[], limit: number = 3): SemanticSearchResult[] {
    const results = this.functions.map(fn => {
      const score = this.cosineSimilarity(queryEmbedding, fn.embedding);
      return {
        functionName: fn.name,
        similarityScore: Math.round(score * 1000) / 1000,
        snippet: fn.snippet
      };
    });

    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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
