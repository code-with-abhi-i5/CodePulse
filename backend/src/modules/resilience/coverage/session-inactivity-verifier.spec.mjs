import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SessionInactivityWarningVerifier } from './session-inactivity-verifier.service.ts';

describe('SessionInactivityWarningVerifier [L2-ERROR-RETRY-OFFLINE-048]', () => {
  test('returns warning within 5 minute remaining window', () => {
    const verifier = new SessionInactivityWarningVerifier(1800000, 300000);
    const now = Date.now();
    verifier.touch(now - 1600000); // 200s left

    const status = verifier.checkWarning(now);
    assert.equal(status.shouldWarn, true);
    assert.equal(status.shouldLogout, false);
    assert.equal(status.remainingMs, 200000);
  });

  test('triggers logout when time expires', () => {
    const verifier = new SessionInactivityWarningVerifier(1000, 200);
    const now = Date.now();
    verifier.touch(now - 1500);

    const status = verifier.checkWarning(now);
    assert.equal(status.shouldLogout, true);
  });
});
