import { IndexBloatReport, ReindexPlan } from '../../types/db';

export class PostgresIndexBloatReindexerService {
  private readonly bloatThresholdPercentage = 35.0;

  evaluateIndex(tableName: string, indexName: string, bloatPercentage: number): IndexBloatReport {
    const isEligible = bloatPercentage >= this.bloatThresholdPercentage;
    const reindexSql = 'REINDEX INDEX CONCURRENTLY ' + indexName + ';';

    return {
      indexName,
      tableName,
      bloatPercentage,
      isEligibleForReindex: isEligible,
      reindexSql
    };
  }

  generateBatchPlan(indexes: Array<{ table: string; index: string; bloat: number }>): IndexBloatReport[] {
    return indexes
      .map(idx => this.evaluateIndex(idx.table, idx.index, idx.bloat))
      .filter(report => report.isEligibleForReindex);
  }
}
