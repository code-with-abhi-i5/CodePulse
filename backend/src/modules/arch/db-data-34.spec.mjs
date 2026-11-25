import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClickHouseIngestionBufferManagerService } from './db-data-34.service.ts';

describe('ClickHouseIngestionBufferManagerService (DB-DATA-34)', () => {
  it('triggers flush on row count limit or time expiration', () => {
    const manager = new ClickHouseIngestionBufferManagerService(3, 1000);

    assert.strictEqual(manager.push('item1'), false);
    assert.strictEqual(manager.push('item2'), false);
    assert.strictEqual(manager.push('item3'), true); // reached 3

    const batch = manager.flush();
    assert.strictEqual(batch.length, 3);
    assert.strictEqual(manager.pendingCount, 0);
  });
});
