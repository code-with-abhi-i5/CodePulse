import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseDataDedupingService } from './db-data-38.service.ts';

describe('ClickHouseDataDedupingService (DB-DATA-38)', () => {
  it('generates ReplacingMergeTree DDL and deduplicates records by highest version', () => {
    const engine = new ClickHouseDataDedupingService();
    const ddl = engine.generateReplacingMergeTreeDdl('battle_events', ['battle_id', 'event_id'], 'version');

    assert.ok(ddl.includes('ENGINE = ReplacingMergeTree(version)'));
    assert.ok(ddl.includes('ORDER BY (battle_id, event_id)'));

    const deduped = engine.deduplicateInMemory([
      { id: '1', version: 1, val: 'old' },
      { id: '1', version: 2, val: 'newest' },
      { id: '2', version: 1, val: 'only' }
    ]);

    assert.strictEqual(deduped.length, 2);
    assert.strictEqual(deduped.find((d) => d.id === '1').val, 'newest');
  });
});
