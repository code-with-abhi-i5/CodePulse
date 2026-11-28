import test from 'node:test';
import assert from 'node:assert/strict';
import { ModalScrollLockManager } from './modal-scroll-lock-manager.service.ts';

test('ModalScrollLockManager [L2-MODAL-A11Y-MOTION-057]', async (t) => {
  const mgr = new ModalScrollLockManager();

  await t.test('applies scroll lock and layout shift prevention padding', () => {
    const lock1 = mgr.lock();
    assert.equal(lock1.locked, true);
    assert.equal(lock1.overflow, 'hidden');
    assert.equal(lock1.paddingRight, '15px');
    assert.equal(mgr.getLockCount(), 1);
  });

  await t.test('maintains lock if nested modal is closed while parent is open', () => {
    mgr.lock(); // lock 2
    assert.equal(mgr.getLockCount(), 2);

    const unlock1 = mgr.unlock();
    assert.equal(unlock1.locked, true);
    assert.equal(unlock1.overflow, 'hidden');

    const unlock2 = mgr.unlock();
    assert.equal(unlock2.locked, false);
    assert.equal(unlock2.overflow, 'unset');
    assert.equal(unlock2.paddingRight, '0px');
  });
});
