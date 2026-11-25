import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { GithubAppWebhookListenerService } from './api-int-12.service.ts';

describe('GithubAppWebhookListenerService (API-INT-12)', () => {
  it('verifies github webhook hmac signatures and deduplicates deliveries', () => {
    const secret = 'test-secret-xyz';
    const listener = new GithubAppWebhookListenerService(secret);
    const body = JSON.stringify({ action: 'opened', issue: { number: 10 } });
    const hmac = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

    const res1 = listener.processWebhook('deliv-1', body, hmac);
    assert.strictEqual(res1.accepted, true);
    assert.strictEqual(res1.duplicate, false);

    // Duplicate check
    const res2 = listener.processWebhook('deliv-1', body, hmac);
    assert.strictEqual(res2.accepted, false);
    assert.strictEqual(res2.duplicate, true);
  });
});
