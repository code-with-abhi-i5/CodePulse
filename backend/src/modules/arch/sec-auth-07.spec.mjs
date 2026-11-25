import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CsrfDoubleSubmitCookieGuardService } from './sec-auth-07.service.ts';

describe('CsrfDoubleSubmitCookieGuardService (SEC-AUTH-07)', () => {
  it('validates signed double-submit tokens and rejects forged or mismatched headers', () => {
    const guard = new CsrfDoubleSubmitCookieGuardService();
    const { cookieValue, headerValue } = guard.generateCsrfToken('sess-999');

    // Valid match
    assert.strictEqual(guard.validateCsrfRequest('sess-999', cookieValue, headerValue), true);

    // Mismatched header vs cookie
    assert.strictEqual(guard.validateCsrfRequest('sess-999', cookieValue, 'tampered-header'), false);

    // Invalid session ID
    assert.strictEqual(guard.validateCsrfRequest('sess-attacker', cookieValue, headerValue), false);
  });
});
