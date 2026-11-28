import test from 'node:test';
import assert from 'node:assert/strict';
import { SmartQueryRetryGovernor } from './smart-query-retry-governor.service.ts';

test('SmartQueryRetryGovernor [L2-ERROR-RETRY-OFFLINE-003]', async (t) => {
  const governor = new SmartQueryRetryGovernor();

  await t.test('calculates exponential delay with capped maximum', () => {
    const delay1 = governor.calculateDelay(1, 1000, 30000);
    assert.ok(delay1 >= 2000 && delay1 <= 2400);

    const delayMax = governor.calculateDelay(10, 1000, 15000);
    assert.ok(delayMax >= 15000 && delayMax <= 18000);
  });

  await t.test('prevents retry on client 404 but allows on 503 and 429', () => {
    assert.equal(governor.shouldRetry(404, 1), false);
    assert.equal(governor.shouldRetry(400, 1), false);
    assert.equal(governor.shouldRetry(503, 1), true);
    assert.equal(governor.shouldRetry(429, 2), true);
    assert.equal(governor.shouldRetry(500, 3), false); // exceeded maxAttempts
  });
});
