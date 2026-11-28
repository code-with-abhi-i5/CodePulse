import test from 'node:test';
import assert from 'node:assert/strict';
import { StaggeredCoverageVerifier } from './staggered-coverage-verifier.service.ts';

test('StaggeredCoverageVerifier [L2-MODAL-A11Y-MOTION-044]', async (t) => {
  const verifier = new StaggeredCoverageVerifier();

  await t.test('validates monotonic progression of staggered animation delays', () => {
    assert.equal(verifier.verifyMonotonicDelay([0, 60, 120, 180]), true);
    assert.equal(verifier.verifyMonotonicDelay([0, 120, 60]), false);
    assert.equal(verifier.verifyMonotonicDelay([]), true);
  });
});
