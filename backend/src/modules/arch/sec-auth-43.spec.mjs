import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TlsConfigurationAuditorService } from './sec-auth-43.service.ts';

describe('TlsConfigurationAuditorService (SEC-AUTH-43)', () => {
  it('approves modern TLS 1.3 configurations with approved AEAD ciphers', () => {
    const auditor = new TlsConfigurationAuditorService();
    const result = auditor.auditTlsConfig({
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      ciphers: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256']
    });

    assert.strictEqual(result.compliant, true);
    assert.strictEqual(result.violations.length, 0);
  });

  it('flags legacy TLS versions (1.0/1.1/1.2) and weak CBC ciphers', () => {
    const auditor = new TlsConfigurationAuditorService();
    const result = auditor.auditTlsConfig({
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.2',
      ciphers: ['TLS_RSA_WITH_AES_128_CBC_SHA', 'TLS_AES_256_GCM_SHA384']
    });

    assert.strictEqual(result.compliant, false);
    assert.ok(result.violations.some(v => v.includes('TLS 1.3 must be enforced')));
    assert.ok(result.violations.some(v => v.includes('Weak or deprecated ciphers detected')));
  });
});
