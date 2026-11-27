import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DLQExponentialReplayCoordinator } from './dlq-exponential-replay.service.ts';

describe('DLQExponentialReplayCoordinator [ARCH-CORE-007]', () => {
  test('calculates exponential backoff with jitter within bounded delay', () => {
    const coordinator = new DLQExponentialReplayCoordinator(100, 5000);
    const delay0 = coordinator.calculateBackoff(0);
    const delay3 = coordinator.calculateBackoff(3);

    assert.ok(delay0 >= 100 && delay0 <= 150);
    assert.ok(delay3 >= 800 && delay3 <= 1200);

    const maxed = coordinator.calculateBackoff(20);
    assert.ok(maxed <= 5000);
  });

  test('schedules replay updating retryCount and nextRetryAt', () => {
    const coordinator = new DLQExponentialReplayCoordinator(500, 10000);
    const msg = { id: 'm1', topic: 'billing', payload: {}, retryCount: 0, lastError: 'Timeout' };
    const scheduled = coordinator.scheduleReplay(msg);
    assert.equal(scheduled.retryCount, 1);
    assert.ok((scheduled.nextRetryAt ?? 0) > Date.now());
  });
});
