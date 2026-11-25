import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PostgreSqlTablePartitioningService } from './db-data-04.service.ts';

describe('PostgreSqlTablePartitioningService (DB-DATA-04)', () => {
  it('generates accurate monthly partition DDL and resolves partition names', () => {
    const service = new PostgreSqlTablePartitioningService();
    const p = service.generateMonthlyPartitionDdl('submission_logs', 2026, 11);

    assert.strictEqual(p.partitionName, 'submission_logs_y2026m11');
    assert.ok(p.ddl.includes("FOR VALUES FROM ('2026-11-01 00:00:00') TO ('2026-12-01 00:00:00')"));

    const resolved = service.resolvePartitionName('submission_logs', new Date('2026-11-25T10:00:00Z'));
    assert.strictEqual(resolved, 'submission_logs_y2026m11');
  });
});
