import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConnectionPoolThreadStarvationWatchdogService } from './db-data-46.service.ts';

describe('ConnectionPoolThreadStarvationWatchdogService (DB-DATA-46)', () => {
  it('detects thread starvation and generates diagnostic stack traces', () => {
    const watchdog = new ConnectionPoolThreadStarvationWatchdogService(3000);
    const result = watchdog.evaluateStarvation({
      activeThreads: 10,
      maxThreads: 10,
      queuedTasks: 25,
      longestQueuedDurationMs: 4500
    });

    assert.strictEqual(result.isStarved, true);
    assert.strictEqual(result.severity, 'CRITICAL');
    assert.ok(result.message.includes('Thread starvation detected'));
    assert.ok(result.stackTrace !== undefined);
  });
});
