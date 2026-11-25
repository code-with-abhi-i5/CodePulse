import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OptimisticUiStateReconcilerService } from './fe-ui-04.service.ts';

describe('OptimisticUiStateReconcilerService (FE-UI-04)', () => {
  it('applies optimistic UI state changes and rolls back on failure', () => {
    const reconciler = new OptimisticUiStateReconcilerService({ score: 10, lives: 3 });

    // Optimistically deduct life and increment score
    reconciler.applyOptimisticMutation('tx_1', { score: 20, lives: 2 });
    assert.deepStrictEqual(reconciler.getState(), { score: 20, lives: 2 });

    // Server reports websocket failure -> rollback
    reconciler.rollbackMutation('tx_1');
    assert.deepStrictEqual(reconciler.getState(), { score: 10, lives: 3 });
  });

  it('commits optimistic state successfully upon server confirmation', () => {
    const reconciler = new OptimisticUiStateReconcilerService({ count: 5 });
    reconciler.applyOptimisticMutation('tx_2', { count: 6 });
    reconciler.commitMutation('tx_2');
    assert.deepStrictEqual(reconciler.getState(), { count: 6 });
  });
});
