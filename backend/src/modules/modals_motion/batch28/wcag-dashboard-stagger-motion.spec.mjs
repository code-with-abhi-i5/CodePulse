import test from 'node:test';
import assert from 'node:assert/strict';
import { WcagDashboardStaggerMotion } from './wcag-dashboard-stagger-motion.service.ts';

test('WcagDashboardStaggerMotion [L2-MODAL-A11Y-MOTION-034]', async (t) => {
  const motion = new WcagDashboardStaggerMotion();

  await t.test('disables translateY and transitions for reduced motion users', () => {
    const style = motion.getAccessibleStyle(3, true);
    assert.equal(style.transform, 'none');
    assert.equal(style.transition, 'none');
    assert.equal(style.opacity, 1);
  });

  await t.test('configures fluid staggered transition for default users', () => {
    const style = motion.getAccessibleStyle(2, false);
    assert.ok(style.transition.includes('120ms'));
  });
});
