import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WaitDieResourceArbiterService } from './wait-die-resource-arbiter.service.ts';

describe('WaitDieResourceArbiterService [ARCH-CORE-037]', () => {
  test('older transaction waits when conflicting with younger holder', () => {
    const arbiter = new WaitDieResourceArbiterService();
    arbiter.registerTransaction('tx_old', 100);
    arbiter.registerTransaction('tx_young', 200);

    const lock1 = arbiter.requestLock('tx_young', 'table_users', 'EXCLUSIVE');
    assert.equal(lock1.action, 'ACQUIRED');

    // Older transaction requests lock held by younger: should WAIT
    const lock2 = arbiter.requestLock('tx_old', 'table_users', 'EXCLUSIVE');
    assert.equal(lock2.action, 'WAIT');
    assert.equal(lock2.granted, false);
  });

  test('younger transaction dies when conflicting with older holder', () => {
    const arbiter = new WaitDieResourceArbiterService();
    arbiter.registerTransaction('tx_old', 100);
    arbiter.registerTransaction('tx_young', 200);

    const lock1 = arbiter.requestLock('tx_old', 'table_accounts', 'EXCLUSIVE');
    assert.equal(lock1.action, 'ACQUIRED');

    // Younger transaction requests lock held by older: should DIE
    const lock2 = arbiter.requestLock('tx_young', 'table_accounts', 'EXCLUSIVE');
    assert.equal(lock2.action, 'DIE');
    assert.equal(lock2.granted, false);
  });

  test('unblocks waiting transaction when lock is released', () => {
    const arbiter = new WaitDieResourceArbiterService();
    arbiter.registerTransaction('tx_1', 100);
    arbiter.registerTransaction('tx_2', 150);

    arbiter.requestLock('tx_2', 'res_a', 'EXCLUSIVE');
    arbiter.requestLock('tx_1', 'res_a', 'EXCLUSIVE'); // tx_1 waits

    const unblocked = arbiter.releaseLock('tx_2', 'res_a');
    assert.deepEqual(unblocked, ['tx_1']);
    assert.equal(arbiter.getActiveHolders('res_a')[0].txId, 'tx_1');
  });
});
