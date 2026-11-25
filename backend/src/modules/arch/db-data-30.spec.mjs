import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseRetentionCleanerService } from './db-data-30.service.ts';

describe('ClickHouseRetentionCleanerService (DB-DATA-30)', () => {
  it('identifies expired time-series partitions and generates drop DDL', () => {
    const cleaner = new ClickHouseRetentionCleanerService(90);
    const partitions = [
      { partitionName: '202611', partitionMonth: '202611' }, // current
      { partitionName: '202607', partitionMonth: '202607' }  // expired (>90 days)
    ];

    const expired = cleaner.getExpiredPartitions(partitions, new Date('2026-11-25T00:00:00Z'));
    assert.strictEqual(expired.length, 1);
    assert.strictEqual(expired[0].partitionName, '202607');
    assert.ok(expired[0].dropDdl.includes("DROP PARTITION '202607'"));
  });
});
