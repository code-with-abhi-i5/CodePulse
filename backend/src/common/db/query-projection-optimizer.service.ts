import { ProjectionOptimizationResult } from '../../types/db';

export class QueryProjectionOptimizerService {
  constructor(private readonly heavyColumns: string[] = ['raw_trace', 'ast_tree', 'telemetry_blob', 'submission_code']) {}

  public optimizeQuery(
    sqlQuery: string,
    requestedFields: string[] = []
  ): ProjectionOptimizationResult {
    const strippedColumns: string[] = [];

    // If query uses SELECT *, replace with requested fields or exclude heavy columns
    if (/selects+*s+from/i.test(sqlQuery)) {
      let fieldsToProject: string[];
      if (requestedFields.length > 0) {
        fieldsToProject = requestedFields;
        this.heavyColumns.forEach(h => {
          if (!requestedFields.includes(h)) {
            strippedColumns.push(h);
          }
        });
      } else {
        // Exclude heavy columns by default
        strippedColumns.push(...this.heavyColumns);
        fieldsToProject = ['id', 'created_at', 'updated_at', 'status'];
      }

      const projectedSql = sqlQuery.replace(/selects+*s+from/i, `SELECT ${fieldsToProject.map(f => `"${f}"`).join(', ')} FROM`);
      const estimatedPayloadSavingsPercent = strippedColumns.length > 0 ? 80 : 0;

      return {
        optimizedSql: projectedSql,
        requestedFields: fieldsToProject,
        strippedColumns,
        estimatedPayloadSavingsPercent
      };
    }

    return {
      optimizedSql: sqlQuery,
      requestedFields,
      strippedColumns: [],
      estimatedPayloadSavingsPercent: 0
    };
  }
}
