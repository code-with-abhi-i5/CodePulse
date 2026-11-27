import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TanStackRetryGovernorVerifier } from './tanstack-retry-verifier.service.ts';

describe('TanStackRetryGovernorVerifier [L2-ERROR-RETRY-OFFLINE-043]', () => {
  const verifier = new TanStackRetryGovernorVerifier();

  test('correctly identifies retryable HTTP error codes', () => {
    assert.equal(verifier.isRetryableStatus(500), true);
    assert.equal(verifier.isRetryableStatus(503), true);
    assert.equal(verifier.isRetryableStatus(429), true);
    assert.equal(verifier.isRetryableStatus(404), false);
    assert.equal(verifier.isRetryableStatus(400), false);
  });

  test('computes exponential delay bounds', () => {
    assert.equal(verifier.computeDelay(0, 500), 500);
    assert.equal(verifier.computeDelay(1, 500), 1000);
    assert.equal(verifier.computeDelay(2, 500), 2000);
  });
});
