import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportConfettiDensityController } from './viewport-confetti-density-controller.service.ts';

test('ViewportConfettiDensityController [L2-MODAL-A11Y-MOTION-012]', async (t) => {
  const controller = new ViewportConfettiDensityController();

  await t.test('throttles particle count on mobile and low power devices to preserve 60fps', () => {
    assert.equal(controller.resolveDensity(true, false), 35);
    assert.equal(controller.resolveDensity(true, true), 20);
    assert.equal(controller.resolveDensity(false, false), 80);
  });
});
