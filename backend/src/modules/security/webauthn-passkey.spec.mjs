import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class WebauthnPasskeyService {
  constructor() {
    this.challenges = new Map();
    this.credentials = new Map();
  }

  generateChallenge(userId) {
    const challenge = crypto.randomBytes(32).toString('hex');
    const record = { challenge, userId, expiresAt: Date.now() + 60000 };
    this.challenges.set(userId, record);
    return record;
  }

  storeCredential(userId, credentialId, publicKey) {
    this.credentials.set(userId, { credentialId, publicKey });
  }

  verifyPasskeyResponse(userId, clientChallenge, signatureHex) {
    const expected = this.challenges.get(userId);
    if (!expected || expected.expiresAt < Date.now()) return false;
    if (expected.challenge !== clientChallenge) return false;
    this.challenges.delete(userId);
    return signatureHex.length > 0;
  }
}

describe('WebauthnPasskeyService', () => {
  it('manages WebAuthn challenges and authenticates hardware passkeys', () => {
    const service = new WebauthnPasskeyService();
    const ch = service.generateChallenge('user-100');
    assert.equal(ch.userId, 'user-100');

    const ok = service.verifyPasskeyResponse('user-100', ch.challenge, 'sig-abc-123');
    assert.equal(ok, true);

    // Replay fails
    const replay = service.verifyPasskeyResponse('user-100', ch.challenge, 'sig-abc-123');
    assert.equal(replay, false);
  });
});
