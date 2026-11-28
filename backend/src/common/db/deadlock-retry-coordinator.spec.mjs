import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class DeadlockRetryCoordinatorService {
  constructor(config = { maxRetries: 3, initialBackoffMs: 50, maxBackoffMs: 1000 }) {
    this.config = config;
  }

  isDeadlockError(error) {
    const code = error?.code || '';
    const message = (error?.message || '').toLowerCase();
    return code === '40P01' || code === '40001' || message.includes('deadlock detected') || message.includes('could not serialize access');
  }

  calculateBackoff(attempt, randomMultiplier = Math.random()) {
    const base = this.config.initialBackoffMs * Math.pow(2, attempt);
    const clamped = Math.min(base, this.config.maxBackoffMs);
    return Math.floor(clamped * randomMultiplier);
  }

  async executeWithRetry(operation) {
    let lastError;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation(attempt);
        return { result, attempts: attempt + 1 };
      } catch (err) {
        lastError = err;
        if (!this.isDeadlockError(err) || attempt === this.config.maxRetries) {
          throw err;
        }
      }
    }
    throw lastError;
  }
}

describe('DeadlockRetryCoordinatorService', () => {
  const coordinator = new DeadlockRetryCoordinatorService({ maxRetries: 3, initialBackoffMs: 100, maxBackoffMs: 800 });

  it('correctly detects Postgres deadlock error codes and messages', () => {
    assert.equal(coordinator.isDeadlockError({ code: '40P01' }), true);
    assert.equal(coordinator.isDeadlockError({ code: '40001' }), true);
    assert.equal(coordinator.isDeadlockError({ message: 'ERROR: deadlock detected' }), true);
    assert.equal(coordinator.isDeadlockError({ code: '23505', message: 'duplicate key' }), false);
  });

  it('calculates jittered exponential backoffs within caps', () => {
    const backoff0 = coordinator.calculateBackoff(0, 1.0);
    assert.equal(backoff0, 100);

    const backoff2 = coordinator.calculateBackoff(2, 1.0);
    assert.equal(backoff2, 400);

    const backoffCapped = coordinator.calculateBackoff(10, 1.0);
    assert.equal(backoffCapped, 800);
  });

  it('successfully retries and resolves after transient deadlock error', async () => {
    let callCount = 0;
    const { result, attempts } = await coordinator.executeWithRetry(async (attempt) => {
      callCount++;
      if (attempt === 0) {
        const err = new Error('deadlock detected');
        err.code = '40P01';
        throw err;
      }
      return 'SUCCESS_DATA';
    });

    assert.equal(result, 'SUCCESS_DATA');
    assert.equal(attempts, 2);
    assert.equal(callCount, 2);
  });
});
