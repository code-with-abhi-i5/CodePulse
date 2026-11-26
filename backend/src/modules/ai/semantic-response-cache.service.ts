import { SemanticCacheEntry, SemanticCacheLookupResult } from '../../types/ai';

export class SemanticResponseCacheService {
  private cache: SemanticCacheEntry[] = [];
  private readonly similarityThreshold = 0.90;

  set(query: string, embedding: number[], response: string): void {
    this.cache.push({
      query,
      embedding,
      response,
      hitCount: 0,
      timestamp: Date.now()
    });
  }

  get(queryEmbedding: number[]): SemanticCacheLookupResult {
    let bestScore = -1;
    let bestEntry: SemanticCacheEntry | undefined;

    for (const entry of this.cache) {
      const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestEntry && bestScore >= this.similarityThreshold) {
      bestEntry.hitCount++;
      return {
        isHit: true,
        similarity: Math.round(bestScore * 1000) / 1000,
        cachedResponse: bestEntry.response
      };
    }

    return {
      isHit: false,
      similarity: Math.max(0, Math.round(bestScore * 1000) / 1000)
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const mag = Math.sqrt(magA) * Math.sqrt(magB);
    return mag === 0 ? 0 : dot / mag;
  }
}
