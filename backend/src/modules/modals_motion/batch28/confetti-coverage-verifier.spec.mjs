import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfettiCoverageVerifier } from './confetti-coverage-verifier.service.ts';

test('ConfettiCoverageVerifier [L2-MODAL-A11Y-MOTION-042]', async (t) => {
  const verifier = new ConfettiCoverageVerifier();

  await t.test('validates particle count and numerical trajectory invariants', () => {
    const valid = [{ vx: 1.2, vy: -3.4 }, { vx: -0.5, vy: -2.1 }];
    assert.equal(verifier.verifyParticleCount(valid, 2), true);
    assert.equal(verifier.verifyParticleCount(valid, 3), false);
    assert.equal(verifier.verifyParticleCount([{ vx: NaN, vy: 1 }], 1), false);
  });
});
