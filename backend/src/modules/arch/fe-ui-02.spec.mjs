import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebGlBattleArenaLodOptimizerService, LodTier } from './fe-ui-02.service.ts';

describe('WebGlBattleArenaLodOptimizerService (FE-UI-02)', () => {
  it('dynamically assigns LOD mesh tiers based on camera distance thresholds', () => {
    const optimizer = new WebGlBattleArenaLodOptimizerService(20, 60, 150);
    const camera = { x: 0, y: 0, z: 0 };

    assert.strictEqual(optimizer.resolveLodTier(camera, { x: 10, y: 0, z: 0 }), LodTier.HIGH);
    assert.strictEqual(optimizer.resolveLodTier(camera, { x: 50, y: 0, z: 0 }), LodTier.MEDIUM);
    assert.strictEqual(optimizer.resolveLodTier(camera, { x: 100, y: 0, z: 0 }), LodTier.LOW);
    assert.strictEqual(optimizer.resolveLodTier(camera, { x: 250, y: 0, z: 0 }), LodTier.BILLBOARD);
  });
});
