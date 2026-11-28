import test from 'node:test';
import assert from 'node:assert/strict';
import { ReducedMotionPolicyManager } from './reduced-motion-policy-manager.service.ts';

test('ReducedMotionPolicyManager [L2-MODAL-A11Y-MOTION-060]', async (t) => {
  const mgr = new ReducedMotionPolicyManager();

  await t.test('eliminates animation duration when reduced motion is requested', () => {
    const config = mgr.resolveAnimationConfig(true, 500);
    assert.equal(config.duration, 0);
    assert.equal(config.enableTransitions, false);
    assert.equal(config.timingFunction, 'step-end');
  });

  await t.test('maintains fluid spring animations for default motion', () => {
    const config = mgr.resolveAnimationConfig(false, 350);
    assert.equal(config.duration, 350);
    assert.equal(config.enableTransitions, true);
  });
});
