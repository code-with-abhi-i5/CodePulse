import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MonacoMultiCursorCrdtSyncService } from './fe-ui-18.service.ts';

describe('MonacoMultiCursorCrdtSyncService (FE-UI-18)', () => {
  it('transforms cursor position accurately when remote text insertions and deletions occur', () => {
    const sync = new MonacoMultiCursorCrdtSyncService();

    // Cursor at index 20, remote user inserts 5 characters at index 10
    const next1 = sync.transformCursor(20, {
      type: 'INSERT',
      position: 10,
      length: 5,
      text: 'hello',
      clientId: 'peer_1'
    }, false);
    assert.strictEqual(next1, 25);

    // Cursor at index 25, remote user deletes 3 characters at index 5
    const next2 = sync.transformCursor(25, {
      type: 'DELETE',
      position: 5,
      length: 3,
      clientId: 'peer_1'
    }, false);
    assert.strictEqual(next2, 22);
  });
});
