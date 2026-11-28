import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class PkiCertChainValidatorService {
  constructor(trustedRootCAs = new Set(['CodePulse-Root-CA'])) {
    this.trustedRootCAs = trustedRootCAs;
  }

  validateChain(certificates, now = Date.now()) {
    const errors = [];
    if (certificates.length === 0) {
      return {
        isValid: false,
        subject: '',
        issuer: '',
        chainLength: 0,
        errors: ['Empty certificate chain provided']
      };
    }

    const leaf = certificates[0];
    const root = certificates[certificates.length - 1];

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i];
      if (now < cert.validFromMs) {
        errors.push('Certificate ' + cert.subject + ' is not yet valid');
      }
      if (now > cert.validToMs) {
        errors.push('Certificate ' + cert.subject + ' has expired');
      }

      if (i < certificates.length - 1) {
        const nextCert = certificates[i + 1];
        if (cert.issuer !== nextCert.subject) {
          errors.push('Chain break between ' + cert.subject + ' (issuer: ' + cert.issuer + ') and next subject ' + nextCert.subject);
        }
      }
    }

    if (!this.trustedRootCAs.has(root.issuer) && !this.trustedRootCAs.has(root.subject)) {
      errors.push('Root issuer ' + root.issuer + ' is not in trusted root CA store');
    }

    return {
      isValid: errors.length === 0,
      subject: leaf.subject,
      issuer: leaf.issuer,
      chainLength: certificates.length,
      errors
    };
  }
}

describe('PkiCertChainValidatorService', () => {
  const validator = new PkiCertChainValidatorService();

  it('validates a complete, unexpired PKI chain linked to trusted root', () => {
    const chain = [
      { subject: 'api.codepulse.io', issuer: 'CodePulse-Intermediate-CA', validFromMs: 1000, validToMs: 50000 },
      { subject: 'CodePulse-Intermediate-CA', issuer: 'CodePulse-Root-CA', validFromMs: 500, validToMs: 100000 }
    ];

    const result = validator.validateChain(chain, 10000);
    assert.equal(result.isValid, true);
    assert.equal(result.chainLength, 2);
    assert.equal(result.errors.length, 0);
  });

  it('flags broken chain links and untrusted root issuers', () => {
    const brokenChain = [
      { subject: 'api.codepulse.io', issuer: 'Foreign-Intermediate', validFromMs: 1000, validToMs: 50000 },
      { subject: 'Different-Subject', issuer: 'Unknown-Root', validFromMs: 500, validToMs: 100000 }
    ];

    const result = validator.validateChain(brokenChain, 10000);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Chain break')));
    assert.ok(result.errors.some(e => e.includes('not in trusted root')));
  });

  it('handles empty chain input cleanly', () => {
    const result = validator.validateChain([]);
    assert.equal(result.isValid, false);
    assert.equal(result.chainLength, 0);
  });
});
