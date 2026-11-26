import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

class ReliableWebhookDispatcher {
  constructor(secret = 'whsec_enterprise_secret') {
    this.secret = secret;
  }

  generateHmacSignature(payload) {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  computeBackoffDelay(attempt, baseMs = 100) {
    return Math.min(baseMs * Math.pow(2, attempt - 1), 5000);
  }

  simulateDispatch(endpoint, payload, mockFails = 0) {
    const raw = JSON.stringify(payload);
    const signature = this.generateHmacSignature(raw);
    let attempts = 0;
    while (attempts <= mockFails && attempts < 3) {
      attempts++;
    }
    const delivered = attempts > mockFails;
    return {
      endpoint,
      attempts,
      statusCode: delivered ? 200 : 500,
      signature: `sha256=${signature}`,
      delivered
    };
  }
}

test('ReliableWebhookDispatcher - signs payloads with HMAC-SHA256 and calculates exponential backoff', () => {
  const dispatcher = new ReliableWebhookDispatcher('test_secret');
  const payload = { eventId: 'evt_1', eventType: 'user.created', timestamp: 12345, data: { name: 'Alice' } };
  const res = dispatcher.simulateDispatch('https://example.com/webhook', payload, 1);
  assert.strictEqual(res.delivered, true);
  assert.strictEqual(res.attempts, 2);
  assert.match(res.signature, /^sha256=[a-f0-9]{64}$/);
  assert.strictEqual(dispatcher.computeBackoffDelay(1, 100), 100);
  assert.strictEqual(dispatcher.computeBackoffDelay(3, 100), 400);
});
