import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportFocusTrapMobileTouch } from './viewport-focus-trap-mobile-touch.service.ts';

test('ViewportFocusTrapMobileTouch [L2-MODAL-A11Y-MOTION-011]', async (t) => {
  const trap = new ViewportFocusTrapMobileTouch();

  await t.test('suppresses initial auto-focus keyboard pop on touch devices', () => {
    assert.equal(trap.resolveActiveFocusTarget(true, 'input-search'), null);
    assert.equal(trap.resolveActiveFocusTarget(false, 'input-search'), 'input-search');
  });
});
