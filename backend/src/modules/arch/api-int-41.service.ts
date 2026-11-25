/**
 * Architecture Service: GraphQL APQ Cache Service
 * Subsystem: GraphQL Performance & Persisted Query Lookup
 */

export class GraphqlApqCacheService {
  private readonly maxEntries: number;
  private readonly store = new Map<string, string>(); // hash -> query

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  public get(hash: string): string | null {
    if (!this.store.has(hash)) return null;
    const query = this.store.get(hash)!;
    // Reinsert to refresh LRU
    this.store.delete(hash);
    this.store.set(hash, query);
    return query;
  }

  public set(hash: string, query: string): void {
    if (this.store.has(hash)) {
      this.store.delete(hash);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(hash, query);
  }

  public size(): number {
    return this.store.size;
  }
}
