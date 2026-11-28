import test from 'node:test';
import assert from 'node:assert/strict';
import { DeletionCoverageVerifier } from './deletion-coverage-verifier.service.ts';

test('DeletionCoverageVerifier [L2-MODAL-A11Y-MOTION-045]', async (t) => {
  const verifier = new DeletionCoverageVerifier();

  await t.test('verifies match of trimmed repository deletion confirmation', () => {
    assert.equal(verifier.verifyMatch('code-pulse', 'code-pulse'), true);
    assert.equal(verifier.verifyMatch('code-pulse', 'wrong'), false);
    assert.equal(verifier.verifyMatch('', ''), false);
  });
});
