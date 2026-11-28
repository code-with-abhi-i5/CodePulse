import { MigrationLockStatus } from '../../types/db';

export class MigrationLockCoordinatorService {
  private activeLock: MigrationLockStatus | null = null;

  constructor(private readonly defaultTtlMs: number = 30000) {}

  public acquireLock(lockKey: number, ownerId: string, now: number = Date.now()): MigrationLockStatus {
    if (this.activeLock && this.activeLock.leaseExpiresAt > now) {
      if (this.activeLock.ownerId === ownerId && this.activeLock.lockKey === lockKey) {
        // Idempotent re-acquisition
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

  public renewLock(lockKey: number, ownerId: string, extensionMs: number = 15000, now: number = Date.now()): boolean {
    if (this.activeLock && this.activeLock.lockKey === lockKey && this.activeLock.ownerId === ownerId) {
      if (this.activeLock.leaseExpiresAt > now) {
        this.activeLock.leaseExpiresAt = now + extensionMs;
        return true;
      }
    }
    return false;
  }

  public releaseLock(lockKey: number, ownerId: string): boolean {
    if (this.activeLock && this.activeLock.lockKey === lockKey && this.activeLock.ownerId === ownerId) {
      this.activeLock = null;
      return true;
    }
    return false;
  }
}
