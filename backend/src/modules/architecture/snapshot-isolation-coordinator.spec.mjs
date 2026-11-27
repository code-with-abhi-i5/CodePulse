import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotIsolationCoordinator } from './snapshot-isolation-coordinator.service.ts';

describe('SnapshotIsolationCoordinator [ARCH-CORE-020]', () => {
  test('provides consistent snapshot isolation without dirty reads', () => {
    const coord = new SnapshotIsolationCoordinator();
    const t0 = coord.beginTransaction('t0');
    coord.write('t0', 'balance', 100);
    coord.commit('t0');

    // T1 starts, sees 100
    coord.beginTransaction('t1');
    assert.equal(coord.read('t1', 'balance'), 100);

    // T2 updates balance to 200 and commits
    coord.beginTransaction('t2');
    coord.write('t2', 'balance', 200);
    coord.commit('t2');

    // T1 still reads 100 (repeatable snapshot isolation)
    assert.equal(coord.read('t1', 'balance'), 100);
  });

  test('aborts transaction on write-write conflict (first-committer-wins)', () => {
    const coord = new SnapshotIsolationCoordinator();
    coord.beginTransaction('setup');
    coord.write('setup', 'slot', 'free');
    coord.commit('setup');

    coord.beginTransaction('tx_a');
    coord.beginTransaction('tx_b');

    coord.write('tx_a', 'slot', 'taken_by_a');
    coord.write('tx_b', 'slot', 'taken_by_b');

    // First committer succeeds
    const resA = coord.commit('tx_a');
    assert.equal(resA.success, true);

    // Second committer conflicts and aborts
    const resB = coord.commit('tx_b');
    assert.equal(resB.success, false);
    assert.equal(resB.conflictKey, 'slot');
  });
});
