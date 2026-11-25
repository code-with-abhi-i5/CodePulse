import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseCompactionSchedulerService } from './db-data-12.service.ts';

describe('ClickHouseCompactionSchedulerService (DB-DATA-12)', () => {
  it('schedules OPTIMIZE TABLE FINAL for partitions with excessive small parts', () => {
    const scheduler = new ClickHouseCompactionSchedulerService(5);
    const parts = [
      { tableName: 'telemetry_events', partition: '202611', activePartsCount: 8, uncompressedBytes: 100_000, compressedBytes: 25_000 },
      { tableName: 'telemetry_events', partition: '202610', activePartsCount: 2, uncompressedBytes: 100_000, compressedBytes: 25_000 }
    ];

    const result = scheduler.evaluateCompaction(parts);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].partition, '202611');
    assert.ok(result[0].optimizeDdl.includes('FINAL'));
    assert.strictEqual(result[0].compressionRatio, 4.0);
  });
});
