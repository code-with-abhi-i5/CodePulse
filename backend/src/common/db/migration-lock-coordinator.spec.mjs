import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MigrationLockCoordinatorService {
  constructor(defaultTtlMs = 30000) {
    this.defaultTtlMs = defaultTtlMs;
    this.activeLock = null;
  }

  acquireLock(lockKey, ownerId, now = Date.now()) {
    if (this.activeLock && this.activeLock.leaseExpiresAt > now) {
      if (this.activeLock.ownerId === ownerId && this.activeLock.lockKey === lockKey) {
        return this.activeLock;
      }
      return {
        acquired: false,
        lockKey,
        leaseExpiresAt: this.activeLock.leaseExpiresAt,
        ownerId: this.activeLock.ownerId
      };
    }

    this.activeLock = {
      acquired: true,
      lockKey,
      leaseExpiresAt: now + this.defaultTtlMs,
      ownerId
    };

    return this.activeLock;
  }

  renewLock(lockKey, ownerId, extensionMs = 15000, now = Date.now()) {
    if (this.activeLock && this.activeLock.lockKey === lockKey && this.activeLock.ownerId === ownerId) {
      if (this.activeLock.leaseExpiresAt > now) {
        this.activeLock.leaseExpiresAt = now + extensionMs;
        return true;
      }
    }
    return false;
  }

  releaseLock(lockKey, ownerId) {
    if (this.activeLock && this.activeLock.lockKey === lockKey && this.activeLock.ownerId === ownerId) {
      this.activeLock = null;
      return true;
    }
    return false;
  }
}

describe('MigrationLockCoordinatorService', () => {
  const coordinator = new MigrationLockCoordinatorService(30000);

  it('acquires lock when free and blocks competing owners', () => {
    const now = 1000;
    const lock1 = coordinator.acquireLock(999, 'node-a', now);
    assert.equal(lock1.acquired, true);
    assert.equal(lock1.ownerId, 'node-a');

    const lock2 = coordinator.acquireLock(999, 'node-b', now);
    assert.equal(lock2.acquired, false);
    assert.equal(lock2.ownerId, 'node-a');
  });

  it('allows idempotent re-acquisition by same owner', () => {
    const lockSame = coordinator.acquireLock(999, 'node-a', 2000);
    assert.equal(lockSame.acquired, true);
  });

  it('renews active lease successfully and rejects expired renewal', () => {
    const renewed = coordinator.renewLock(999, 'node-a', 15000, 5000);
    assert.equal(renewed, true);

    const expiredRenewal = coordinator.renewLock(999, 'node-a', 15000, 50000);
    assert.equal(expiredRenewal, false);
  });

  it('releases lock cleanly for subsequent nodes', () => {
    const released = coordinator.releaseLock(999, 'node-a');
    assert.equal(released, true);

    const lockNew = coordinator.acquireLock(999, 'node-b', 60000);
    assert.equal(lockNew.acquired, true);
    assert.equal(lockNew.ownerId, 'node-b');
  });
});
