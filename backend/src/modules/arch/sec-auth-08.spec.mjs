import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MfaTotpRateLimiterService } from './sec-auth-08.service.ts';

describe('MfaTotpRateLimiterService (SEC-AUTH-08)', () => {
  it('tracks failed TOTP attempts and imposes temporary lockout after exceeding limit', () => {
    const limiter = new MfaTotpRateLimiterService(3, 60000);

    assert.strictEqual(limiter.checkAllowed('user-1').isAllowed, true);

    limiter.recordFailure('user-1');
    limiter.recordFailure('user-1');
    const locked = limiter.recordFailure('user-1'); // 3rd failure

    assert.strictEqual(locked.isNowLocked, true);
    assert.strictEqual(limiter.checkAllowed('user-1').isAllowed, false);

    // Success resets count
    limiter.recordSuccess('user-1');
    assert.strictEqual(limiter.checkAllowed('user-1').isAllowed, true);
  });
});
