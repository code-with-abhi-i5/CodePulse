import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookMtlsClientCertValidatorService } from './api-int-53.service.ts';

describe('WebhookMtlsClientCertValidatorService (API-INT-53)', () => {
  it('validates enterprise mTLS client certificates against trusted root CAs and expiration', () => {
    const validator = new WebhookMtlsClientCertValidatorService();
    validator.registerTrustedIssuer('CodePulse Enterprise CA');

    const validCert = { subjectCN: 'enterprise-client-1', issuerCN: 'CodePulse Enterprise CA', validTo: Date.now() + 100000 };
    assert.strictEqual(validator.validateCert(validCert).valid, true);

    const untrustedCert = { subjectCN: 'hacker', issuerCN: 'Untrusted Root', validTo: Date.now() + 100000 };
    assert.strictEqual(validator.validateCert(untrustedCert).valid, false);
  });
});
