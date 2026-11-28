import test from 'node:test';
import assert from 'node:assert/strict';
import { ScrollLockNestedVerifier } from './scroll-lock-nested-verifier.service.ts';

test('ScrollLockNestedVerifier [L2-MODAL-A11Y-MOTION-047]', async (t) => {
  const verifier = new ScrollLockNestedVerifier();

  await t.test('verifies body overflow invariant during dialog presence', () => {
    assert.equal(verifier.verifyInvariant(1, 'hidden'), true);
    assert.equal(verifier.verifyInvariant(2, 'hidden'), true);
    assert.equal(verifier.verifyInvariant(1, 'visible'), false);
    assert.equal(verifier.verifyInvariant(0, 'unset'), true);
  });
});
