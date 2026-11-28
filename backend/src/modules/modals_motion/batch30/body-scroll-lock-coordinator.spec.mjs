import test from 'node:test';
import assert from 'node:assert/strict';
import { BodyScrollLockCoordinator } from './body-scroll-lock-coordinator.service.ts';

test('BodyScrollLockCoordinator [L2-MODAL-A11Y-MOTION-007]', async (t) => {
  const coordinator = new BodyScrollLockCoordinator();

  await t.test('coordinates shared scroll lock across multiple dialogs', () => {
    coordinator.acquireLock('dialog-a');
    coordinator.acquireLock('dialog-b');
    assert.equal(coordinator.isLocked(), true);

    const firstRelease = coordinator.releaseLock('dialog-a');
    assert.equal(firstRelease, false);
    assert.equal(coordinator.isLocked(), true);

    const secondRelease = coordinator.releaseLock('dialog-b');
    assert.equal(secondRelease, true);
    assert.equal(coordinator.isLocked(), false);
  });
});
