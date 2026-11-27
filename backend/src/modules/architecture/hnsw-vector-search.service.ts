export interface VectorItem {
  id: string;
  vector: number[];
}

export class HNSWVectorSearchEngine {
  private items: VectorItem[] = [];

  public cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  public add(id: string, vector: number[]): void {
    this.items.push({ id, vector });
  }

  public searchKnn(queryVector: number[], k: number): { id: string; score: number }[] {
    const scored = this.items.map(item => ({
      id: item.id,
      score: this.cosineSimilarity(queryVector, item.vector)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  public size(): number {
    return this.items.length;
  }
}
