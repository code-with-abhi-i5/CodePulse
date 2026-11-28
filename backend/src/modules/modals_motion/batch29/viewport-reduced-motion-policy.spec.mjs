import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportReducedMotionPolicy } from './viewport-reduced-motion-policy.service.ts';

test('ViewportReducedMotionPolicy [L2-MODAL-A11Y-MOTION-020]', async (t) => {
  const policy = new ViewportReducedMotionPolicy();

  await t.test('optimizes duration for responsive mobile touch transitions', () => {
    const mobile = policy.getResponsiveMotionConfig(390, false);
    assert.equal(mobile.durationMs, 180);

    const desktop = policy.getResponsiveMotionConfig(1024, false);
    assert.equal(desktop.durationMs, 300);

    const reduced = policy.getResponsiveMotionConfig(390, true);
    assert.equal(reduced.durationMs, 0);
  });
});
