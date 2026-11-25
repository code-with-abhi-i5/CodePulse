import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MfaRegistrationRateLimiterService } from './sec-auth-52.service.ts';

describe('MfaRegistrationRateLimiterService (SEC-AUTH-52)', () => {
  it('enforces E.164 format and rejects virtual VoIP prefixes', () => {
    const guard = new MfaRegistrationRateLimiterService(3);

    const validRes = guard.registerAttempt('usr_1', '+14155552671');
    assert.strictEqual(validRes.allowed, true);

    const badFormat = guard.registerAttempt('usr_1', '4155552671');
    assert.strictEqual(badFormat.allowed, false);
    assert.match(badFormat.error, /standard E.164 format/i);

    const voip = guard.registerAttempt('usr_1', '+15551234567');
    assert.strictEqual(voip.allowed, false);
    assert.match(voip.error, /Virtual VoIP or toll-free numbers are prohibited/i);
  });

  it('enforces sliding-window registration rate limits per user and phone', () => {
    const guard = new MfaRegistrationRateLimiterService(2);
    const phone = '+14159998877';

    assert.strictEqual(guard.registerAttempt('usr_2', phone).allowed, true);
    assert.strictEqual(guard.registerAttempt('usr_2', phone).allowed, true);
    const blocked = guard.registerAttempt('usr_2', phone);
    assert.strictEqual(blocked.allowed, false);
    assert.match(blocked.error, /Too many MFA registration requests/i);
  });
});
