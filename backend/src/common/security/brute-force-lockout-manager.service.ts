import { LockoutStatus } from '../../types/security';

export class BruteForceLockoutManagerService {
  private readonly strikeMap = new Map<string, { strikes: number; lockedUntil: number }>();

  constructor(
    private readonly strikeThreshold: number = 5,
    private readonly lockoutDurationMs: number = 300000 // 5 mins
  ) {}

  public recordFailedAttempt(identity: string, now: number = Date.now()): LockoutStatus {
    const current = this.strikeMap.get(identity) || { strikes: 0, lockedUntil: 0 };
    current.strikes++;

    if (current.strikes >= this.strikeThreshold) {
      current.lockedUntil = now + this.lockoutDurationMs;
    }

    this.strikeMap.set(identity, current);
    return this.checkStatus(identity, now);
  }

  public checkStatus(identity: string, now: number = Date.now()): LockoutStatus {
    const record = this.strikeMap.get(identity);
    if (!record) {
      return { isLocked: false, currentStrikes: 0, lockoutRemainingMs: 0, action: 'ALLOW' };
    }

    if (record.lockedUntil > now) {
      return {
        isLocked: true,
        currentStrikes: record.strikes,
        lockoutRemainingMs: record.lockedUntil - now,
        action: 'LOCKOUT'
      };
    }

    return {
      isLocked: false,
      currentStrikes: record.strikes,
      lockoutRemainingMs: 0,
      action: record.strikes >= 3 ? 'WARN' : 'ALLOW'
    };
  }

  public resetStrikes(identity: string): void {
    this.strikeMap.delete(identity);
  }
}
