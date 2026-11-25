import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseQueryMemoryProtectorService } from './db-data-02.service.ts';

describe('ClickHouseQueryMemoryProtectorService (DB-DATA-02)', () => {
  it('injects progressive sampling into heavy queries exceeding memory budget', () => {
    const protector = new ClickHouseQueryMemoryProtectorService(100 * 1024 * 1024); // 100MB
    const rawSql = 'SELECT count(*) FROM user_events WHERE event_date >= today() - 30';

    // 10 million rows * 128 bytes = 1.28 GB (> 100 MB)
    const result = protector.protectQuery(rawSql, 10_000_000, 128);
    assert.strictEqual(result.samplingApplied, true);
    assert.ok(result.sampleRate < 0.1);
    assert.ok(result.rewrittenQuery.includes('SAMPLE'));
  });
});
