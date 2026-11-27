import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TwoPhaseCommitCoordinator } from './two-phase-commit-coordinator.service.ts';

describe('TwoPhaseCommitCoordinator [ARCH-CORE-027]', () => {
  test('successfully commits when all participants vote PREPARE YES', async () => {
    const coordinator = new TwoPhaseCommitCoordinator();
    const trace = [];

    const p1 = {
      id: 'db_shard1',
      prepare: () => { trace.push('p1_prep'); return true; },
      commit: () => { trace.push('p1_commit'); },
      abort: () => { trace.push('p1_abort'); }
    };
    const p2 = {
      id: 'db_shard2',
      prepare: () => { trace.push('p2_prep'); return true; },
      commit: () => { trace.push('p2_commit'); },
      abort: () => { trace.push('p2_abort'); }
    };

    coordinator.registerTransaction('tx_success', [p1, p2]);
    const res = await coordinator.executeTransaction('tx_success');

    assert.equal(res, true);
    assert.equal(coordinator.getTransactionState('tx_success'), 'COMMITTED');
    assert.ok(trace.includes('p1_commit'));
    assert.ok(trace.includes('p2_commit'));
  });

  test('aborts transaction across all participants if one participant votes NO', async () => {
    const coordinator = new TwoPhaseCommitCoordinator();
    const trace = [];

    const p1 = {
      id: 'p1',
      prepare: () => true,
      commit: () => {},
      abort: () => { trace.push('p1_aborted'); }
    };
    const p2 = {
      id: 'p2',
      prepare: () => false, // Vetoes prepare
      commit: () => {},
      abort: () => { trace.push('p2_aborted'); }
    };

    coordinator.registerTransaction('tx_fail', [p1, p2]);
    const res = await coordinator.executeTransaction('tx_fail');

    assert.equal(res, false);
    assert.equal(coordinator.getTransactionState('tx_fail'), 'ABORTED');
    assert.ok(trace.includes('p1_aborted'));
    assert.ok(trace.includes('p2_aborted'));
  });
});
