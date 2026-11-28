import test from 'node:test';
import assert from 'node:assert/strict';
import { MotionReducedQueryListener } from './motion-reduced-query-listener.service.ts';

test('MotionReducedQueryListener [L2-MODAL-A11Y-MOTION-010]', async (t) => {
  const listener = new MotionReducedQueryListener();

  await t.test('evaluates system prefers-reduced-motion media query match', () => {
    assert.equal(listener.isReducedMotionPreferred(true), true);
    assert.equal(listener.isReducedMotionPreferred(false), false);
  });
});
