import test from 'node:test';
import assert from 'node:assert/strict';
import { RadarScanAnimationManager } from './radar-scan-animation-manager.service.ts';

test('RadarScanAnimationManager [L2-MODAL-A11Y-MOTION-056]', async (t) => {
  const mgr = new RadarScanAnimationManager();

  await t.test('computes continuous 360-degree radar rotation cycle', () => {
    const quarter = mgr.computeRadarParams(600, 2400);
    assert.equal(quarter.angleDeg, 90);
    assert.equal(quarter.transform, 'rotate(90deg)');

    const half = mgr.computeRadarParams(1200, 2400);
    assert.equal(half.angleDeg, 180);
  });

  await t.test('interpolates pulse opacity fading outward', () => {
    const start = mgr.computeRadarParams(0, 2400);
    assert.equal(start.pulseOpacity, 0.8);
    assert.equal(start.ringScale, 1);

    const mid = mgr.computeRadarParams(1200, 2400);
    assert.equal(mid.pulseOpacity, 0.4);
    assert.equal(mid.ringScale, 1.75);
  });
});
