import test from 'node:test';
import assert from 'node:assert/strict';
import { ReducedMotionVerifier } from './reduced-motion-verifier.service.ts';

test('ReducedMotionVerifier [L2-MODAL-A11Y-MOTION-050]', async (t) => {
  const verifier = new ReducedMotionVerifier();

  await t.test('flags violations when animations execute under reduced-motion preference', () => {
    assert.equal(verifier.verifySafety(300, true), false);
    assert.equal(verifier.verifySafety(0, true), true);
    assert.equal(verifier.verifySafety(300, false), true);
  });
});
