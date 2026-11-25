import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { OAuth2PkceGuardService } from './sec-auth-03.service.ts';

describe('OAuth2PkceGuardService (SEC-AUTH-03)', () => {
  it('validates S256 code challenge with verifier and prevents state token replays', () => {
    const guard = new OAuth2PkceGuardService();
    const verifier = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    guard.createSession('state-abc', challenge);

    // Valid verification
    assert.strictEqual(guard.verifyCodeVerifier('state-abc', verifier), true);

    // Replay attempt fails
    assert.strictEqual(guard.verifyCodeVerifier('state-abc', verifier), false);
  });
});
