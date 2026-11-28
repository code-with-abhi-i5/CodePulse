import test from 'node:test';
import assert from 'node:assert/strict';
import { BountyConfettiExplosion } from './bounty-confetti-explosion.service.ts';

test('BountyConfettiExplosion [L2-MODAL-A11Y-MOTION-052]', async (t) => {
  const confetti = new BountyConfettiExplosion();

  await t.test('generates specified particle count with velocity vectors and colors', () => {
    const batch = confetti.generateParticleBatch(30, { x: 0.5, y: 0.5 });
    assert.equal(batch.length, 30);
    assert.ok(batch[0].vx !== undefined);
    assert.ok(batch[0].vy !== undefined);
    assert.ok(batch[0].color.startsWith('#'));
    assert.ok(batch[0].lifespanMs >= 1500);
  });
});
