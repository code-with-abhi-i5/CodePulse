import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaConnectionPoolDeadlockService } from './db-data-01.service.ts';

describe('PrismaConnectionPoolDeadlockService (DB-DATA-01)', () => {
  it('detects connection pool exhaustion deadlock and recommends dynamic expansion', () => {
    const detector = new PrismaConnectionPoolDeadlockService(3000, 30);
    const result = detector.evaluatePoolHealth({
      activeConnections: 10,
      idleConnections: 0,
      maxPoolSize: 10,
      queuedRequests: 15,
      longestWaitMs: 4500
    });

    assert.strictEqual(result.isDeadlocked, true);
    assert.strictEqual(result.recommendedAction, 'EXPAND_POOL');
    assert.strictEqual(result.newPoolSize, 15);
  });
});
