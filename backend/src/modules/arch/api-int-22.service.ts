/**
 * Architecture Service: GraphQL Query Result Caching Layer
 * Subsystem: API Performance & Tag-Based Invalidation
 */

export interface CachedQueryResult {
  data: unknown;
  tags: string[];
  expiresAt: number;
}

export class GraphqlQueryCacheLayerService {
  private readonly cache = new Map<string, CachedQueryResult>();
  private readonly tagIndex = new Map<string, Set<string>>(); // tag -> Set<queryHash>

  public set(queryHash: string, data: unknown, tags: string[], ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(queryHash, { data, tags, expiresAt });

    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(queryHash);
    }
  }

  public get(queryHash: string): unknown | null {
    const entry = this.cache.get(queryHash);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(queryHash);
      return null;
    }
    return entry.data;
  }

  public invalidateByTag(tag: string): number {
    const queryHashes = this.tagIndex.get(tag);
    if (!queryHashes || queryHashes.size === 0) return 0;

    let count = 0;
    for (const qh of queryHashes) {
      if (this.cache.delete(qh)) count++;
    }
    this.tagIndex.delete(tag);
    return count;
  }
}
