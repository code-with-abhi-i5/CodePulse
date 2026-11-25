import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OfflineBattleStatePersistenceService } from './fe-ui-06.service.ts';

describe('OfflineBattleStatePersistenceService (FE-UI-06)', () => {
  it('queues offline battle actions and manages sync state upon reconnection', () => {
    const service = new OfflineBattleStatePersistenceService();
    const a1 = service.enqueueAction('battle_1', 'KEY_STROKE', { line: 1, char: 'a' });
    const a2 = service.enqueueAction('battle_1', 'EXECUTE_CODE', {});

    const pending = service.getPendingActions();
    assert.strictEqual(pending.length, 2);

    service.markSynced([a1.id]);
    assert.strictEqual(service.getPendingActions().length, 1);
    assert.strictEqual(service.getPendingActions()[0].id, a2.id);

    service.clearSynced();
    assert.strictEqual(service.getPendingActions().length, 1);
  });
});
