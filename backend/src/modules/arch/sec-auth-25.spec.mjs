import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SecurityHeadersEnforcementService } from './sec-auth-25.service.ts';

describe('SecurityHeadersEnforcementService (SEC-AUTH-25)', () => {
  it('enforces modern HSTS and security response headers', () => {
    const service = new SecurityHeadersEnforcementService();
    const headers = service.getHardenedHeaders();

    assert.ok(headers['Strict-Transport-Security'].includes('includeSubDomains'));
    assert.strictEqual(headers['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(headers['X-Frame-Options'], 'DENY');
    assert.strictEqual(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  });
});
