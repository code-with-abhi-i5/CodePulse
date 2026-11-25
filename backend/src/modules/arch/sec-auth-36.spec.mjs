import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OpenRedirectMitigatorService } from './sec-auth-36.service.ts';

describe('OpenRedirectMitigatorService (SEC-AUTH-36)', () => {
  it('allows safe relative paths and trusted domains while blocking open redirect bypasses', () => {
    const mitigator = new OpenRedirectMitigatorService(['codepulse.io', 'app.codepulse.io']);

    // Safe relative
    assert.strictEqual(mitigator.sanitizeRedirectUrl('/dashboard'), '/dashboard');

    // Safe trusted absolute
    assert.strictEqual(mitigator.sanitizeRedirectUrl('https://app.codepulse.io/profile'), 'https://app.codepulse.io/profile');

    // Protocol-relative attack (//evil.com)
    assert.strictEqual(mitigator.sanitizeRedirectUrl('//evil.com'), '/dashboard');

    // Malicious foreign domain
    assert.strictEqual(mitigator.sanitizeRedirectUrl('https://evil-site.com/steal-creds'), '/dashboard');
  });
});
