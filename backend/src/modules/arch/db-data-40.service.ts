/**
 * Architecture Service: Prisma Migration Lock Deadlock Resolver
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-40]
 */

export interface MigrationLockStatus {
  isLocked: boolean;
  lockedAt?: number;
  lockKey: string;
}

export class PrismaMigrationLockResolverService {
  private lockTimeoutMs: number;

  constructor(lockTimeoutMs: number = 60000) { // 60s max migration lock duration
    this.lockTimeoutMs = lockTimeoutMs;
  }

  public evaluateAndResolveLock(
    status: MigrationLockStatus,
    now: number = Date.now()
  ): {
    isStuck: boolean;
    unlockDdl: string | null;
  } {
    if (!status.isLocked || !status.lockedAt) {
      return { isStuck: false, unlockDdl: null };
    }

    if (now - status.lockedAt > this.lockTimeoutMs) {
      return {
        isStuck: true,
        unlockDdl: `SELECT pg_advisory_unlock(${status.lockKey}); UPDATE _prisma_migrations SET rolled_back_at = now() WHERE rolled_back_at IS NULL AND finished_at IS NULL;`
      };
    }

    return { isStuck: false, unlockDdl: null };
  }
}
