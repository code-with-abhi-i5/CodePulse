import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportEscapeListenerTouch } from './viewport-escape-listener-touch.service.ts';

test('ViewportEscapeListenerTouch [L2-MODAL-A11Y-MOTION-013]', async (t) => {
  const listener = new ViewportEscapeListenerTouch();

  await t.test('dismisses on Escape key or mobile backdrop tap', () => {
    assert.equal(listener.shouldHandleDismissal({ key: 'Escape' }), true);
    assert.equal(listener.shouldHandleDismissal({ isBackdropTouch: true }), true);
    assert.equal(listener.shouldHandleDismissal({ key: 'Enter' }), false);
  });
});
