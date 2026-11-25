import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseQueryCostGovernorService } from './db-data-37.service.ts';

describe('DatabaseQueryCostGovernorService (DB-DATA-37)', () => {
  it('rejects heavy unindexed sequential scans in production', () => {
    const governor = new DatabaseQueryCostGovernorService(5000, 10000, true);

    const badScan = governor.evaluateQueryPlan({
      nodeType: 'Seq Scan',
      totalCost: 3500,
      estimatedRows: 50000,
      tableName: 'submissions'
    });
    assert.strictEqual(badScan.allowed, false);
    assert.ok(badScan.reason.includes('unindexed full-table scan'));

    const goodIndexScan = governor.evaluateQueryPlan({
      nodeType: 'Index Scan',
      totalCost: 120,
      estimatedRows: 1,
      tableName: 'submissions'
    });
    assert.strictEqual(goodIndexScan.allowed, true);
  });
});
