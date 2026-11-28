import test from 'node:test';
import assert from 'node:assert/strict';
import { BottomSheetVelocityVerifier } from './bottom-sheet-velocity-verifier.service.ts';

test('BottomSheetVelocityVerifier [L2-MODAL-A11Y-MOTION-049]', async (t) => {
  const verifier = new BottomSheetVelocityVerifier();

  await t.test('identifies downward flicks that exceed velocity threshold', () => {
    assert.equal(verifier.isFlickDismiss(0.8), true);
    assert.equal(verifier.isFlickDismiss(0.3), false);
    assert.equal(verifier.isFlickDismiss(-1.2), false);
  });
});
