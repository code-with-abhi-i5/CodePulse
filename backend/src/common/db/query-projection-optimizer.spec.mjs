import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class QueryProjectionOptimizerService {
  constructor(heavyColumns = ['raw_trace', 'ast_tree', 'telemetry_blob', 'submission_code']) {
    this.heavyColumns = heavyColumns;
  }

  optimizeQuery(sqlQuery, requestedFields = []) {
    const strippedColumns = [];

    if (/select\s+\*\s+from/i.test(sqlQuery)) {
      let fieldsToProject;
      if (requestedFields.length > 0) {
        fieldsToProject = requestedFields;
        this.heavyColumns.forEach(h => {
          if (!requestedFields.includes(h)) {
            strippedColumns.push(h);
          }
        });
      } else {
        strippedColumns.push(...this.heavyColumns);
        fieldsToProject = ['id', 'created_at', 'updated_at', 'status'];
      }

      const projectedSql = sqlQuery.replace(/select\s+\*\s+from/i, 'SELECT ' + fieldsToProject.map(f => '"' + f + '"').join(', ') + ' FROM');
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

describe('QueryProjectionOptimizerService', () => {
  const optimizer = new QueryProjectionOptimizerService();

  it('replaces SELECT * with requested fields and identifies stripped heavy columns', () => {
    const query = 'SELECT * FROM submissions WHERE user_id = 1;';
    const result = optimizer.optimizeQuery(query, ['id', 'status']);
    assert.ok(result.optimizedSql.includes('SELECT "id", "status" FROM submissions'));
    assert.equal(result.strippedColumns.length, 4);
    assert.equal(result.estimatedPayloadSavingsPercent, 80);
  });

  it('preserves targeted queries that already specify projection lists', () => {
    const query = 'SELECT id, title FROM challenges WHERE id = 10;';
    const result = optimizer.optimizeQuery(query, ['id', 'title']);
    assert.equal(result.optimizedSql, query);
    assert.equal(result.strippedColumns.length, 0);
  });
});
