/**
 * Architecture Service: Query Result Cache with Row-Level CDC Invalidation
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-10]
 */

export class DatabaseQueryCacheWithCdcInvalidationService {
  private cache: Map<string, { value: unknown; tags: Set<string> }>;

  constructor() {
    this.cache = new Map();
  }

  public set(key: string, value: unknown, tags: string[]): void {
    this.cache.set(key, { value, tags: new Set(tags) });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.value as T) : null;
  }

  public handleCdcEvent(table: string, entityId?: string): number {
    const targetTag = entityId ? `${table}:${entityId}` : table;
    let invalidatedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.has(targetTag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  public size(): number {
    return this.cache.size;
  }
}
