import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PiiDynamicMaskingInterceptorService } from './sec-auth-10.service.ts';

describe('PiiDynamicMaskingInterceptorService (SEC-AUTH-10)', () => {
  it('masks sensitive keys, tokens, passwords, and emails recursively in telemetry objects', () => {
    const interceptor = new PiiDynamicMaskingInterceptorService();
    const payload = {
      username: 'alice',
      password: 'super-secret-password',
      email: 'alice.smith@example.com',
      metadata: {
        authToken: 'jwt-token-val',
        publicNote: 'hello world'
      }
    };

    const masked = interceptor.maskObject(payload);
    assert.strictEqual(masked.password, '***MASKED***');
    assert.strictEqual(masked.metadata.authToken, '***MASKED***');
    assert.strictEqual(masked.metadata.publicNote, 'hello world');
    assert.strictEqual(masked.email, 'a***h@example.com');
  });
});
