import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PasskeySignatureVerifierService {
  constructor(expectedOrigin = 'https://codepulse.io') {
    this.expectedOrigin = expectedOrigin;
  }

  verifyPasskeyAuth(userId, credentialId, clientDataJsonBase64, expectedChallenge, counter, previousCounter) {
    let clientData;
    try {
      const decoded = Buffer.from(clientDataJsonBase64, 'base64url').toString('utf8');
      clientData = JSON.parse(decoded);
    } catch {
      return { verified: false, userId, credentialId, counter, error: 'Malformed clientDataJSON' };
    }

    if (clientData.type !== 'webauthn.get') {
      return { verified: false, userId, credentialId, counter, error: 'Invalid WebAuthn operation type' };
    }

    if (clientData.challenge !== expectedChallenge) {
      return { verified: false, userId, credentialId, counter, error: 'Challenge mismatch' };
    }

    if (clientData.origin !== this.expectedOrigin) {
      return { verified: false, userId, credentialId, counter, error: 'Origin "' + clientData.origin + '" mismatch' };
    }

    if (counter <= previousCounter) {
      return { verified: false, userId, credentialId, counter, error: 'Replay detected: sign counter did not increment' };
    }

    return {
      verified: true,
      userId,
      credentialId,
      counter
    };
  }
}

describe('PasskeySignatureVerifierService', () => {
  const verifier = new PasskeySignatureVerifierService('https://codepulse.io');

  it('authenticates valid passkey WebAuthn client payload with incremented counter', () => {
    const clientData = {
      type: 'webauthn.get',
      challenge: 'random_challenge_123',
      origin: 'https://codepulse.io'
    };
    const b64 = Buffer.from(JSON.stringify(clientData)).toString('base64url');

    const result = verifier.verifyPasskeyAuth('u-1', 'cred-abc', b64, 'random_challenge_123', 15, 14);
    assert.equal(result.verified, true);
    assert.equal(result.counter, 15);
  });

  it('detects cloned authenticator or replay when counter does not increase', () => {
    const clientData = {
      type: 'webauthn.get',
      challenge: 'c-1',
      origin: 'https://codepulse.io'
    };
    const b64 = Buffer.from(JSON.stringify(clientData)).toString('base64url');

    const result = verifier.verifyPasskeyAuth('u-1', 'cred-abc', b64, 'c-1', 10, 10);
    assert.equal(result.verified, false);
    assert.ok(result.error.includes('Replay detected'));
  });
});
