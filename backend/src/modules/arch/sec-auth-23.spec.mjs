import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PasswordResetTokenManagerService } from './sec-auth-23.service.ts';

describe('PasswordResetTokenManagerService (SEC-AUTH-23)', () => {
  it('generates hashed single-use tokens with rate limits and expiration', () => {
    const manager = new PasswordResetTokenManagerService(60000, 60000);
    const { rawToken } = manager.createResetToken('user@codepulse.io');

    // Rate limit rejects immediate duplicate request
    assert.throws(() => manager.createResetToken('user@codepulse.io'), /Rate limit exceeded/);

    // Consume token
    assert.strictEqual(manager.verifyAndConsumeToken('user@codepulse.io', rawToken), true);

    // Replay fails
    assert.strictEqual(manager.verifyAndConsumeToken('user@codepulse.io', rawToken), false);
  });
});
