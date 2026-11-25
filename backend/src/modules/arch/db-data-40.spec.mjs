import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaMigrationLockResolverService } from './db-data-40.service.ts';

describe('PrismaMigrationLockResolverService (DB-DATA-40)', () => {
  it('detects stuck migration lock and generates unlock recovery DDL', () => {
    const resolver = new PrismaMigrationLockResolverService(30000);

    const activeLock = resolver.evaluateAndResolveLock({
      isLocked: true,
      lockedAt: 1000,
      lockKey: '72707372'
    }, 40000); // 39000ms > 30000ms

    assert.strictEqual(activeLock.isStuck, true);
    assert.ok(activeLock.unlockDdl.includes('pg_advisory_unlock(72707372)'));
  });
});
