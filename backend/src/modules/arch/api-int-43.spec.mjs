import { describe, it } from 'node:test';
import assert from 'node:assert';
import { WebhookPayloadMaskingService } from './api-int-43.service.ts';

describe('WebhookPayloadMaskingService (API-INT-43)', () => {
  it('masks sensitive tokens and credentials across nested webhook payloads', () => {
    const masking = new WebhookPayloadMaskingService();
    const payload = {
      event: 'user.created',
      user: {
        id: 1,
        passwordHash: 'secret_12345',
        apiToken: 'tok_abc',
        email: 'user@example.com'
      }
    };

    const result = masking.mask(payload);
    assert.strictEqual(result.user.email, 'user@example.com');
    assert.strictEqual(result.user.passwordHash, '***REDACTED***');
    assert.strictEqual(result.user.apiToken, '***REDACTED***');
  });
});
