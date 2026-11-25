import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TableRowCountEstimatorService } from './db-data-52.service.ts';

describe('TableRowCountEstimatorService (DB-DATA-52)', () => {
  it('generates pg_class catalog query and uses approximation for large datasets', () => {
    const estimator = new TableRowCountEstimatorService();
    const sql = estimator.generateFastCountSql('submissions');
    assert.ok(sql.includes("pg_class WHERE relname = 'submissions'"));

    const bigTable = estimator.resolveCount(1_500_000, 5000);
    assert.strictEqual(bigTable.useEstimate, true);
    assert.strictEqual(bigTable.isApproximate, true);

    const smallTable = estimator.resolveCount(300, 5000);
    assert.strictEqual(smallTable.useEstimate, false);
    assert.strictEqual(smallTable.isApproximate, false);
  });
});
