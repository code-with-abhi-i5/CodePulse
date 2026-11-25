/**
 * Architecture Service: Database Index Bloat Detector with Concurrent Reindexing
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-07]
 */

export interface IndexStats {
  tableName: string;
  indexName: string;
  totalSizeBytes: number;
  bloatSizeBytes: number;
}

export class DatabaseIndexBloatDetectorService {
  private bloatRatioThreshold: number;

  constructor(bloatRatioThreshold: number = 0.3) { // 30% bloat threshold
    this.bloatRatioThreshold = bloatRatioThreshold;
  }

  public detectBloatedIndexes(indexes: IndexStats[]): Array<IndexStats & { bloatRatio: number; reindexCommand: string }> {
    const bloated: Array<IndexStats & { bloatRatio: number; reindexCommand: string }> = [];

    for (const idx of indexes) {
      if (idx.totalSizeBytes <= 0) continue;
      const bloatRatio = idx.bloatSizeBytes / idx.totalSizeBytes;
      if (bloatRatio >= this.bloatRatioThreshold) {
        bloated.push({
          ...idx,
          bloatRatio,
          reindexCommand: `REINDEX INDEX CONCURRENTLY ${idx.indexName};`
        });
      }
    }

    return bloated.sort((a, b) => b.bloatRatio - a.bloatRatio);
  }
}
