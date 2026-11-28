import test from 'node:test';
import assert from 'node:assert/strict';
import { ViewportRadarScanHud } from './viewport-radar-scan-hud.service.ts';

test('ViewportRadarScanHud [L2-MODAL-A11Y-MOTION-016]', async (t) => {
  const hud = new ViewportRadarScanHud();

  await t.test('scales radar HUD down for compact mobile viewports', () => {
    const mobile = hud.getHudDimensions(375);
    assert.equal(mobile.diameterPx, 180);
    assert.equal(mobile.blipScale, 0.8);

    const desktop = hud.getHudDimensions(1024);
    assert.equal(desktop.diameterPx, 280);
    assert.equal(desktop.blipScale, 1.2);
  });
});
