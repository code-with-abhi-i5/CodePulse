import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MagicLinkAuthenticationProviderService } from './sec-auth-41.service.ts';

describe('MagicLinkAuthenticationProviderService (SEC-AUTH-41)', () => {
  it('generates high-entropy disposable tokens and enforces single-use verification', () => {
    const provider = new MagicLinkAuthenticationProviderService('secret-key-test', 60000, 3);
    const email = 'developer@codepulse.io';

    const req1 = provider.requestMagicLink(email);
    assert.strictEqual(req1.success, true);
    assert.ok(req1.token);

    // Verify token
    const verify1 = provider.verifyAndConsume(email, req1.token);
    assert.strictEqual(verify1.valid, true);
    assert.strictEqual(verify1.email, email);

    // Replay attack must be blocked (single-use)
    const replay = provider.verifyAndConsume(email, req1.token);
    assert.strictEqual(replay.valid, false);
    assert.match(replay.error, /already been consumed/i);
  });

  it('enforces request rate limiting per email address', () => {
    const provider = new MagicLinkAuthenticationProviderService('secret-key-test', 60000, 2);
    const email = 'spammer@codepulse.io';

    assert.strictEqual(provider.requestMagicLink(email).success, true);
    assert.strictEqual(provider.requestMagicLink(email).success, true);
    const blocked = provider.requestMagicLink(email);
    assert.strictEqual(blocked.success, false);
    assert.match(blocked.error, /Rate limit exceeded/i);
  });
});
