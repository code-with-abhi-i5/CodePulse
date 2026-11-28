import test from 'node:test';
import assert from 'node:assert/strict';
import { EscapeListenerCoverageVerifier } from './escape-listener-coverage-verifier.service.ts';

test('EscapeListenerCoverageVerifier [L2-MODAL-A11Y-MOTION-043]', async (t) => {
  const verifier = new EscapeListenerCoverageVerifier();

  await t.test('verifies LIFO execution order of escape key handlers', () => {
    assert.equal(verifier.verifyStackOrder(['drawer-2', 'modal-1'], ['drawer-2', 'modal-1']), true);
    assert.equal(verifier.verifyStackOrder(['modal-1', 'drawer-2'], ['drawer-2', 'modal-1']), false);
  });
});
