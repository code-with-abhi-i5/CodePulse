import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CspNonceAndReporterService } from './sec-auth-16.service.ts';

describe('CspNonceAndReporterService (SEC-AUTH-16)', () => {
  it('generates unique per-request CSP nonces and aggregates violation reports', () => {
    const service = new CspNonceAndReporterService();
    const { nonce, cspHeaderValue } = service.generatePerRequestNonce();

    assert.ok(nonce.length > 10);
    assert.ok(cspHeaderValue.includes(`'nonce-${nonce}'`));

    service.recordViolation({
      documentUri: 'https://codepulse.io/challenges',
      blockedUri: 'https://malicious-cdn.com/script.js',
      violatedDirective: 'script-src',
      originalPolicy: cspHeaderValue
    });

    assert.strictEqual(service.getViolationsCount(), 1);
  });
});
