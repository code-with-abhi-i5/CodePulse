import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

class ApiGatewayRequestDeduplicator {
  constructor(windowMs = 60000) {
    this.cache = new Map();
    this.windowMs = windowMs;
  }

  computeHash(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload || '')).digest('hex');
  }

  evaluate(key, payload) {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing) {
      if (now - existing.createdAt < this.windowMs) {
        return { isDuplicate: true, record: existing };
      }
      this.cache.delete(key);
    }

    const hash = this.computeHash(payload);
    const newRecord = {
      key,
      hash,
      status: 'in_flight',
      createdAt: now
    };
    this.cache.set(key, newRecord);
    return { isDuplicate: false, record: newRecord };
  }

  markCompleted(key, statusCode, responseBody) {
    const rec = this.cache.get(key);
    if (rec) {
      rec.status = 'completed';
      rec.statusCode = statusCode;
      rec.responseBody = responseBody;
    }
  }
}

test('ApiGatewayRequestDeduplicator - detects duplicate requests within idempotency window', () => {
  const dedup = new ApiGatewayRequestDeduplicator(10000);
  const key = 'idem_req_123';
  const payload = { code: 'console.log("hello")' };

  const first = dedup.evaluate(key, payload);
  assert.strictEqual(first.isDuplicate, false);
  assert.strictEqual(first.record.status, 'in_flight');

  dedup.markCompleted(key, 201, { success: true });

  const second = dedup.evaluate(key, payload);
  assert.strictEqual(second.isDuplicate, true);
  assert.strictEqual(second.record.status, 'completed');
  assert.strictEqual(second.record.statusCode, 201);
});
