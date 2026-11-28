import { ReentrantLockLease } from '../../types/db';

export class RedisReentrantLeaseExtenderService {
  private locks: Map<string, { ownerToken: string; count: number; expiresAt: number }> = new Map();

  acquire(lockKey: string, ownerToken: string, ttlMs: number = 5000): ReentrantLockLease {
    const existing = this.locks.get(lockKey);
    const now = Date.now();

    if (existing && existing.ownerToken === ownerToken && existing.expiresAt > now) {
      existing.count++;
      existing.expiresAt = now + ttlMs;
      return { lockKey, ownerToken, reentrantCount: existing.count, leaseExpiresAt: existing.expiresAt, isHeld: true };
    }

    if (!existing || existing.expiresAt <= now) {
      const expiresAt = now + ttlMs;
      this.locks.set(lockKey, { ownerToken, count: 1, expiresAt });
      return { lockKey, ownerToken, reentrantCount: 1, leaseExpiresAt: expiresAt, isHeld: true };
    }

    return { lockKey, ownerToken, reentrantCount: 0, leaseExpiresAt: existing.expiresAt, isHeld: false };
  }

  extendHeartbeat(lockKey: string, ownerToken: string, extensionMs: number = 5000): boolean {
    const existing = this.locks.get(lockKey);
    if (existing && existing.ownerToken === ownerToken && existing.expiresAt > Date.now()) {
      existing.expiresAt += extensionMs;
      return true;
    }
    return false;
  }

  release(lockKey: string, ownerToken: string): boolean {
    const existing = this.locks.get(lockKey);
    if (!existing || existing.ownerToken !== ownerToken) return false;

    existing.count--;
    if (existing.count <= 0) {
      this.locks.delete(lockKey);
    }
    return true;
  }
}
