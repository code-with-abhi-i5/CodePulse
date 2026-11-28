import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportModalScrollLock } from './viewport-modal-scroll-lock.service.ts';

test('ViewportModalScrollLock [L2-MODAL-A11Y-MOTION-017]', async (t) => {
  const lock = new ViewportModalScrollLock();

  await t.test('locks iOS and mobile touch scrolling with fixed position', () => {
    const touch = lock.getScrollLockProperties(true);
    assert.equal(touch.bodyPosition, 'fixed');
    assert.equal(touch.bodyWidth, '100%');
    assert.equal(touch.bodyOverflow, 'hidden');

    const desktop = lock.getScrollLockProperties(false);
    assert.equal(desktop.bodyPosition, 'static');
  });
});
