import test from 'node:test';
import assert from 'node:assert/strict';
import { StaggeredDashboardAnimation } from './staggered-dashboard-animation.service.ts';

test('StaggeredDashboardAnimation [L2-MODAL-A11Y-MOTION-054]', async (t) => {
  const anim = new StaggeredDashboardAnimation();

  await t.test('calculates incremental staggered delays capped at maximum', () => {
    assert.equal(anim.computeCardDelay(0), 0);
    assert.equal(anim.computeCardDelay(3), 180);
    assert.equal(anim.computeCardDelay(20), 600); // capped
  });

  await t.test('generates transition style property map', () => {
    const style = anim.getTransitionStyle(2);
    assert.equal(style.transitionDelay, '120ms');
    assert.ok(style.transitionTimingFunction.includes('cubic-bezier'));
  });
});
