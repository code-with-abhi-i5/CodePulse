import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagReducedMotionPolicy } from './wcag-reduced-motion-policy.service.ts';

test('WcagReducedMotionPolicy [L2-MODAL-A11Y-MOTION-040]', async (t) => {
  const policy = new WcagReducedMotionPolicy();

  await t.test('returns WCAG compliant instant transition when reduced motion is requested', () => {
    const props = policy.getA11yTransitionProps(true);
    assert.equal(props.animationDuration, '0.001ms');
    assert.equal(props['aria-live'], 'polite');
  });

  await t.test('returns smooth 250ms transition for standard motion', () => {
    const props = policy.getA11yTransitionProps(false);
    assert.equal(props.animationDuration, '250ms');
  });
});
