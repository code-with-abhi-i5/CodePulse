import { QueryCacheLookup } from '../../types/db';

export class QueryCacheMemoizerService {
  private cache: Map<string, { rows: any[]; tables: string[] }> = new Map();

  get(queryHash: string): QueryCacheLookup {
    const entry = this.cache.get(queryHash);
    if (entry) {
      return { isHit: true, cachedRows: entry.rows, invalidatingTables: entry.tables };
    }
    return { isHit: false, invalidatingTables: [] };
  }

  set(queryHash: string, rows: any[], tables: string[]): void {
    this.cache.set(queryHash, { rows, tables });
  }

  invalidateTable(tableName: string): number {
    let evicted = 0;
    for (const [hash, entry] of this.cache.entries()) {
      if (entry.tables.includes(tableName)) {
        this.cache.delete(hash);
        evicted++;
      }
    }
    return evicted;
  }
}
