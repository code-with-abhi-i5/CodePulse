import test from 'node:test';
import assert from 'node:assert/strict';

class RedisReentrantLeaseExtenderService {
  constructor() {
    this.locks = new Map();
  }

  acquire(lockKey, ownerToken, ttlMs = 5000) {
    const existing = this.locks.get(lockKey);
    const now = Date.now();

    if (existing && existing.ownerToken === ownerToken && existing.expiresAt > now) {
      existing.count++;
      existing.expiresAt = now + ttlMs;
      return { lockKey, ownerToken, reentrantCount: existing.count, isHeld: true };
    }

    if (!existing || existing.expiresAt <= now) {
      this.locks.set(lockKey, { ownerToken, count: 1, expiresAt: now + ttlMs });
      return { lockKey, ownerToken, reentrantCount: 1, isHeld: true };
    }

    return { lockKey, ownerToken, reentrantCount: 0, isHeld: false };
  }

  extendHeartbeat(lockKey, ownerToken, extensionMs = 5000) {
    const existing = this.locks.get(lockKey);
    if (existing && existing.ownerToken === ownerToken && existing.expiresAt > Date.now()) {
      existing.expiresAt += extensionMs;
      return true;
    }
    return false;
  }

  release(lockKey, ownerToken) {
    const existing = this.locks.get(lockKey);
    if (!existing || existing.ownerToken !== ownerToken) return false;
    existing.count--;
    if (existing.count <= 0) this.locks.delete(lockKey);
    return true;
  }
}

test('RedisReentrantLeaseExtenderService - supports re-entrant acquires and heartbeat extensions', () => {
  const service = new RedisReentrantLeaseExtenderService();
  const l1 = service.acquire('resource:1', 'worker-A', 5000);
  assert.equal(l1.isHeld, true);
  assert.equal(l1.reentrantCount, 1);

  const l2 = service.acquire('resource:1', 'worker-A', 5000);
  assert.equal(l2.isHeld, true);
  assert.equal(l2.reentrantCount, 2);

  const extended = service.extendHeartbeat('resource:1', 'worker-A', 3000);
  assert.equal(extended, true);

  service.release('resource:1', 'worker-A');
  service.release('resource:1', 'worker-A');
  const fresh = service.acquire('resource:1', 'worker-B', 5000);
  assert.equal(fresh.isHeld, true);
});
