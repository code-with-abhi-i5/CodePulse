/**
 * Architecture Service: Table Row Count Estimator for Instant Pagination
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-52]
 */

export class TableRowCountEstimatorService {
  public generateFastCountSql(tableName: string): string {
    return `SELECT reltuples::bigint AS estimated_rows FROM pg_class WHERE relname = '${tableName}';`;
  }

  public resolveCount(estimatedRows: number, exactCountThreshold: number = 5000): {
    useEstimate: boolean;
    count: number;
    isApproximate: boolean;
  } {
    if (estimatedRows > exactCountThreshold) {
      return {
        useEstimate: true,
        count: estimatedRows,
        isApproximate: true
      };
    }

    return {
      useEstimate: false,
      count: estimatedRows,
      isApproximate: false
    };
  }
}
