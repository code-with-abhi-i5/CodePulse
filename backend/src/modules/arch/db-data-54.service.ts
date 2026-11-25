/**
 * Architecture Service: Distributed Lock with Heartbeat Renewal
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-54]
 */

export class DistributedLockHeartbeatService {
  private activeLocks: Map<string, { ownerId: string; expiresAt: number; ttlMs: number }>;

  constructor() {
    this.activeLocks = new Map();
  }

  public acquireLock(lockKey: string, ownerId: string, ttlMs: number = 10000): boolean {
    const existing = this.activeLocks.get(lockKey);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      if (existing.ownerId !== ownerId) return false;
    }

    this.activeLocks.set(lockKey, {
      ownerId,
      expiresAt: now + ttlMs,
      ttlMs
    });
    return true;
  }

  public renewHeartbeat(lockKey: string, ownerId: string): boolean {
    const lock = this.activeLocks.get(lockKey);
    const now = Date.now();

    if (!lock || lock.ownerId !== ownerId || lock.expiresAt <= now) {
      return false; // lock lost or expired
    }

    lock.expiresAt = now + lock.ttlMs;
    return true;
  }

  public releaseLock(lockKey: string, ownerId: string): boolean {
    const lock = this.activeLocks.get(lockKey);
    if (!lock || lock.ownerId !== ownerId) return false;
    this.activeLocks.delete(lockKey);
    return true;
  }
}
