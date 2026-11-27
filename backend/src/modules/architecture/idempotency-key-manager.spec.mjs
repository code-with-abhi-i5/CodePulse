import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { IdempotencyKeyReservationManager } from './idempotency-key-manager.service.ts';

describe('IdempotencyKeyReservationManager [ARCH-CORE-015]', () => {
  test('reserves key and prevents duplicate concurrent execution', () => {
    const mgr = new IdempotencyKeyReservationManager();
    const r1 = mgr.reserveKey('idemp_tx_101');
    assert.equal(r1.reserved, true);

    const r2 = mgr.reserveKey('idemp_tx_101');
    assert.equal(r2.reserved, false);
    assert.equal(r2.existingRecord?.state, 'PENDING');

    mgr.commit('idemp_tx_101', { txId: 'txn_99', balance: 500 });
    const r3 = mgr.reserveKey('idemp_tx_101');
    assert.equal(r3.reserved, false);
    assert.equal(r3.existingRecord?.state, 'COMMITTED');
    assert.equal(r3.existingRecord?.result?.balance, 500);
  });
});
