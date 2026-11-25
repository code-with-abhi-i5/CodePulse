/**
 * Architecture Service: Analytical Query Memoization Cache
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-20]
 */

export interface CachedQueryResult {
  queryHash: string;
  tables: string[];
  data: any;
  cachedAt: number;
}

export class AnalyticalQueryMemoizationCacheService {
  private cache: Map<string, CachedQueryResult>;
  private tableToQueries: Map<string, Set<string>>;

  constructor() {
    this.cache = new Map();
    this.tableToQueries = new Map();
  }

  public set(queryHash: string, tables: string[], data: any): void {
    this.cache.set(queryHash, {
      queryHash,
      tables,
      data,
      cachedAt: Date.now()
    });

    for (const tbl of tables) {
      if (!this.tableToQueries.has(tbl)) {
        this.tableToQueries.set(tbl, new Set());
      }
      this.tableToQueries.get(tbl)!.add(queryHash);
    }
  }

  public get(queryHash: string): any | null {
    const entry = this.cache.get(queryHash);
    return entry ? entry.data : null;
  }

  public onTableInsert(tableName: string): number {
    const queryHashes = this.tableToQueries.get(tableName);
    if (!queryHashes) return 0;

    let invalidatedCount = 0;
    for (const qHash of queryHashes) {
      this.cache.delete(qHash);
      invalidatedCount++;
    }
    this.tableToQueries.delete(tableName);
    return invalidatedCount;
  }
}
