import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SlowQueryIndexAnalyzerService {
  analyzeQuery(tableName, sqlQuery) {
    const recommendations = [];
    const normalized = sqlQuery.toLowerCase();

    if (sqlQuery.includes('@>') || normalized.includes('jsonb_path_query') || normalized.includes('jsonb_exists')) {
      const match = sqlQuery.match(/([a-zA-Z0-9_]+)\s*@>/);
      const jsonCol = match ? match[1] : 'metadata';
      const cleanCol = jsonCol.replace(/[^a-zA-Z0-9_]/g, '');
      const idxName = 'idx_' + tableName + '_' + cleanCol + '_gin';
      recommendations.push({
        tableName,
        indexType: 'gin',
        columns: [cleanCol],
        reason: 'JSONB containment queries require GIN indexing for high-speed key/value lookups',
        recommendedSql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "' + idxName + '" ON "' + tableName + '" USING gin ("' + cleanCol + '");'
      });
    }

    const whereMatch = normalized.match(/where\s+(.*?)(?:order\s+by|group\s+by|limit|$)/s);
    const orderMatch = normalized.match(/order\s+by\s+([a-zA-Z0-9_,\s]+)(?:limit|$)/);

    if (whereMatch) {
      const whereClause = whereMatch[1];
      const equalityCols = Array.from(whereClause.matchAll(/([a-zA-Z0-9_]+)\s*=/g)).map(m => m[1]);
      let orderCols = [];
      if (orderMatch) {
        orderCols = orderMatch[1].split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
      }

      const compositeCols = Array.from(new Set([...equalityCols, ...orderCols]));
      if (compositeCols.length >= 2) {
        const colList = compositeCols.join('_');
        const idxName = 'idx_' + tableName + '_' + colList;
        const quotedCols = compositeCols.map(c => '"' + c + '"').join(', ');
        recommendations.push({
          tableName,
          indexType: 'btree_composite',
          columns: compositeCols,
          reason: 'Multi-column equality and sort pattern benefits from composite B-Tree index',
          recommendedSql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "' + idxName + '" ON "' + tableName + '" (' + quotedCols + ');'
        });
      }
    }

    return recommendations;
  }
}

describe('SlowQueryIndexAnalyzerService', () => {
  const analyzer = new SlowQueryIndexAnalyzerService();

  it('detects jsonb containment operator and suggests GIN index', () => {
    const query = 'SELECT * FROM challenge_submissions WHERE telemetry @> ' + JSON.stringify('{"passed": true}') + ';';
    const recs = analyzer.analyzeQuery('challenge_submissions', query);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].indexType, 'gin');
    assert.ok(recs[0].recommendedSql.includes('USING gin ("telemetry")'));
  });

  it('detects composite equality and sorting clauses to recommend composite B-Tree index', () => {
    const query = 'SELECT * FROM battles WHERE status = $1 AND tournament_id = $2 ORDER BY created_at DESC LIMIT 10;';
    const recs = analyzer.analyzeQuery('battles', query);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].indexType, 'btree_composite');
    assert.deepEqual(recs[0].columns, ['status', 'tournament_id', 'created_at']);
    assert.ok(recs[0].recommendedSql.includes('"status", "tournament_id", "created_at"'));
  });
});
