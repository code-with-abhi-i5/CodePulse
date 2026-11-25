import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { WebAuthnFido2ProviderService } from './sec-auth-01.service.ts';

describe('WebAuthnFido2ProviderService (SEC-AUTH-01)', () => {
  it('verifies valid WebAuthn hardware key assertions and detects replay attacks', () => {
    const provider = new WebAuthnFido2ProviderService('codepulse.io', 'https://codepulse.io');

    const clientData = JSON.stringify({
      type: 'webauthn.get',
      challenge: 'random-challenge-token-123',
      origin: 'https://codepulse.io'
    });

    const assertion = {
      credentialId: 'cred-hardware-1',
      clientDataJson: Buffer.from(clientData).toString('base64'),
      authenticatorData: 'base64-auth-data',
      signature: 'base64-sig',
      signCount: 15
    };

    const res = provider.verifyAssertion(assertion, 'random-challenge-token-123', 10);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.newSignCount, 15);

    // Replay attack with same or lower signCount
    const replay = provider.verifyAssertion(assertion, 'random-challenge-token-123', 15);
    assert.strictEqual(replay.isValid, false);
    assert.ok(replay.error.includes('cloned authenticator attack'));
  });
});
