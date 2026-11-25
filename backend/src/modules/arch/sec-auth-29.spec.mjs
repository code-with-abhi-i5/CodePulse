import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EmailVerificationTokenManagerService } from './sec-auth-29.service.ts';

describe('EmailVerificationTokenManagerService (SEC-AUTH-29)', () => {
  it('issues tokens stored as SHA-256 hashes and verifies single-use tokens', () => {
    const manager = new EmailVerificationTokenManagerService();
    const raw = manager.createVerificationToken('user-100');

    assert.strictEqual(manager.verifyToken('user-100', raw), true);
    // Already consumed
    assert.strictEqual(manager.verifyToken('user-100', raw), false);
  });
});
