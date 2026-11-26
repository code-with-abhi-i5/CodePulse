import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class OAuthPkceAuthorizerService {
  generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  verifyPkce(codeVerifier, codeChallenge, method = 'S256') {
    if (method !== 'S256') {
      return {
        valid: false,
        error: 'Only S256 PKCE code challenge method is permitted in production'
      };
    }

    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return {
        valid: false,
        error: 'Code verifier length must be between 43 and 128 characters'
      };
    }

    const calculatedChallenge = this.generateCodeChallenge(codeVerifier);
    const valid = calculatedChallenge.length === codeChallenge.length && crypto.timingSafeEqual(Buffer.from(calculatedChallenge), Buffer.from(codeChallenge));

    return {
      valid,
      error: valid ? undefined : 'PKCE code challenge verification failed'
    };
  }
}

describe('OAuthPkceAuthorizerService', () => {
  const pkce = new OAuthPkceAuthorizerService();

  it('generates and verifies RFC 7636 S256 code challenge pairs', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = pkce.generateCodeChallenge(verifier);

    const res = pkce.verifyPkce(verifier, challenge, 'S256');
    assert.equal(res.valid, true);
  });

  it('rejects plain PKCE transformation methods in production', () => {
    const res = pkce.verifyPkce('verifier-test-12345678901234567890123456789012345', 'challenge', 'plain');
    assert.equal(res.valid, false);
    assert.ok(res.error.includes('Only S256'));
  });

  it('rejects invalid or mismatched code verifiers', () => {
    const challenge = pkce.generateCodeChallenge('valid_verifier_12345678901234567890123456789012345');
    const res = pkce.verifyPkce('wrong_verifier_12345678901234567890123456789012345', challenge, 'S256');
    assert.equal(res.valid, false);
  });
});
