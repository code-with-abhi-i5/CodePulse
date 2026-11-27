import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OptimisticMutationRollbackVerifier } from './optimistic-mutation-verifier.service.ts';

describe('OptimisticMutationRollbackVerifier [L2-ERROR-RETRY-OFFLINE-049]', () => {
  const verifier = new OptimisticMutationRollbackVerifier();

  test('applies optimistic snapshot and commits on mutation success', () => {
    verifier.applyOptimistic('bk_1', false, true);
    assert.equal(verifier.getSnapshot('bk_1')?.status, 'PENDING');

    const committed = verifier.commit('bk_1');
    assert.equal(committed, true);
    assert.equal(verifier.getSnapshot('bk_1')?.status, 'COMMITTED');
  });

  test('rolls back to previous value cleanly on mutation error', () => {
    verifier.applyOptimistic('bk_2', { bookmarked: true, count: 15 }, { bookmarked: false, count: 14 });
    const rb = verifier.rollback('bk_2');
    assert.equal(rb.success, true);
    assert.deepEqual(rb.restoredValue, { bookmarked: true, count: 15 });
    assert.equal(verifier.getSnapshot('bk_2')?.status, 'ROLLEDBACK');
  });
});
