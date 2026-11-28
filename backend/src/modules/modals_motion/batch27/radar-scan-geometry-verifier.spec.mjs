import test from 'node:test';
import assert from 'node:assert/strict';
import { RadarScanGeometryVerifier } from './radar-scan-geometry-verifier.service.ts';

test('RadarScanGeometryVerifier [L2-MODAL-A11Y-MOTION-046]', async (t) => {
  const verifier = new RadarScanGeometryVerifier();

  await t.test('asserts 0-359 degree angle bounds', () => {
    assert.equal(verifier.verifyAngleBounds(0), true);
    assert.equal(verifier.verifyAngleBounds(270), true);
    assert.equal(verifier.verifyAngleBounds(360), false);
    assert.equal(verifier.verifyAngleBounds(-15), false);
  });
});
