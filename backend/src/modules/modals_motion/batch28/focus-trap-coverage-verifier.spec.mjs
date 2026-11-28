import test from 'node:test';
import assert from 'node:assert/strict';
import { FocusTrapCoverageVerifier } from './focus-trap-coverage-verifier.service.ts';

test('FocusTrapCoverageVerifier [L2-MODAL-A11Y-MOTION-041]', async (t) => {
  const verifier = new FocusTrapCoverageVerifier();

  await t.test('verifies circular focus navigation transitions', () => {
    assert.equal(verifier.verifyCycle(3, 2, 0, false), true); // forward wrap
    assert.equal(verifier.verifyCycle(3, 0, 2, true), true);  // backward wrap
    assert.equal(verifier.verifyCycle(3, 1, 2, false), true); // forward step
    assert.equal(verifier.verifyCycle(3, 1, 0, true), true);  // backward step
  });
});
