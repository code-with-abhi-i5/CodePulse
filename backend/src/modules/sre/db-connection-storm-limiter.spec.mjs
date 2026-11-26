import test from 'node:test';
import assert from 'node:assert/strict';

class DbConnectionStormLimiter {
  constructor(baseDelayMs = 100, maxDelayMs = 10000) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  calculateJitteredDelay(clientId, attempt) {
    const exponential = Math.min(this.baseDelayMs * Math.pow(2, attempt - 1), this.maxDelayMs);
    const jitter = Math.floor(Math.random() * (exponential * 0.5));
    const delayMs = exponential + jitter;

    return {
      clientId,
      attempt,
      delayMs,
      maxJitterMs: Math.floor(exponential * 0.5)
    };
  }
}

test('DbConnectionStormLimiter - schedules staggered reconnections with randomized jitter', () => {
  const limiter = new DbConnectionStormLimiter(100, 5000);
  const s1 = limiter.calculateJitteredDelay('client_1', 1);
  assert.strictEqual(s1.attempt, 1);
  assert.ok(s1.delayMs >= 100 && s1.delayMs <= 150);

  const s4 = limiter.calculateJitteredDelay('client_2', 4);
  assert.strictEqual(s4.attempt, 4);
  assert.ok(s4.delayMs >= 800 && s4.delayMs <= 1200);
});
