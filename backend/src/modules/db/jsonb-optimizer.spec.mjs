import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class JsonbOptimizerService {
  generateGinIndexSql(tableName, column, pathExpression) {
    const indexName = `idx_${tableName}_${column}_${pathExpression ? pathExpression.replace(/[^a-zA-Z0-9]/g, '_') : 'gin'}`;
    if (pathExpression) {
      return `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${tableName} USING gin ((${column} -> '${pathExpression}'));`;
    }
    return `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${tableName} USING gin (${column} jsonb_path_ops);`;
  }

  extractQueryablePaths(payload, prefix = '') {
    const paths = [];
    for (const [key, value] of Object.entries(payload)) {
      const full = prefix ? `${prefix}.${key}` : key;
      paths.push(full);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...this.extractQueryablePaths(value, full));
      }
    }
    return paths;
  }
}

describe('JsonbOptimizerService', () => {
  it('analyzes nested JSON payloads and produces optimal GIN indices', () => {
    const service = new JsonbOptimizerService();
    const paths = service.extractQueryablePaths({ testSummary: { passed: 10, total: 10 } });
    assert.ok(paths.includes('testSummary.passed'));

    const ddl = service.generateGinIndexSql('evaluations', 'meta', 'status');
    assert.ok(ddl.includes('idx_evaluations_meta_status'));
    assert.ok(ddl.includes("USING gin ((meta -> 'status'))"));
  });
});
