import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class CspNonceGeneratorService {
  generateNonce() {
    return crypto.randomBytes(16).toString('base64');
  }

  buildCspHeader(nonce) {
    const policy = [
      "default-src 'self'",
      "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic'",
      "style-src 'self' 'nonce-" + nonce + "'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');

    return {
      nonce,
      contentSecurityPolicyHeader: policy
    };
  }
}

describe('CspNonceGeneratorService', () => {
  const csp = new CspNonceGeneratorService();

  it('generates cryptographically random base64 nonces', () => {
    const n1 = csp.generateNonce();
    const n2 = csp.generateNonce();
    assert.notEqual(n1, n2);
    assert.equal(Buffer.from(n1, 'base64').length, 16);
  });

  it('constructs standard CSP header string with strict script nonces', () => {
    const nonce = 'random_nonce_123';
    const directives = csp.buildCspHeader(nonce);

    assert.equal(directives.nonce, nonce);
    assert.ok(directives.contentSecurityPolicyHeader.includes("script-src 'self' 'nonce-random_nonce_123' 'strict-dynamic'"));
    assert.ok(directives.contentSecurityPolicyHeader.includes("object-src 'none'"));
  });
});
