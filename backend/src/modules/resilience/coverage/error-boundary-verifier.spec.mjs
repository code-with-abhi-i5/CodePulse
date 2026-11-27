import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GranularErrorBoundaryVerifier } from './error-boundary-verifier.service.ts';

describe('GranularErrorBoundaryVerifier [L2-ERROR-RETRY-OFFLINE-041]', () => {
  const verifier = new GranularErrorBoundaryVerifier();

  test('recommends TRY_AGAIN action until maximum crash tolerance is hit', () => {
    assert.equal(verifier.getFallbackView(2), 'TRY_AGAIN');

    verifier.recordFailure();
    assert.equal(verifier.getFallbackView(2), 'TRY_AGAIN');

    verifier.recordFailure();
    assert.equal(verifier.getFallbackView(2), 'FATAL_RELOAD');
  });
});
