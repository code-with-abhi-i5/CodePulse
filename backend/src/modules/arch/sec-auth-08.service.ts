/**
 * Architecture Service: MFA TOTP Brute-Force Rate Limiter
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-08]
 */

export class MfaTotpRateLimiterService {
  private failedAttempts: Map<string, { count: number; lockedUntil: number }>;
  private maxAttempts: number;
  private lockoutDurationMs: number;

  constructor(maxAttempts: number = 5, lockoutDurationMs: number = 900000) { // 15 mins lockout
    this.failedAttempts = new Map();
    this.maxAttempts = maxAttempts;
    this.lockoutDurationMs = lockoutDurationMs;
  }

  public checkAllowed(userId: string, now: number = Date.now()): { isAllowed: boolean; lockedRemainingMs?: number } {
    const record = this.failedAttempts.get(userId);
    if (!record) return { isAllowed: true };

    if (now < record.lockedUntil) {
      return { isAllowed: false, lockedRemainingMs: record.lockedUntil - now };
    }

    if (now >= record.lockedUntil && record.lockedUntil > 0) {
      // Lockout expired, reset
      this.failedAttempts.delete(userId);
    }

    return { isAllowed: true };
  }

  public recordFailure(userId: string, now: number = Date.now()): { isNowLocked: boolean; attemptsLeft: number } {
    const record = this.failedAttempts.get(userId) || { count: 0, lockedUntil: 0 };
    record.count++;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutDurationMs;
      this.failedAttempts.set(userId, record);
      return { isNowLocked: true, attemptsLeft: 0 };
    }

    this.failedAttempts.set(userId, record);
    return { isNowLocked: false, attemptsLeft: this.maxAttempts - record.count };
  }

  public recordSuccess(userId: string): void {
    this.failedAttempts.delete(userId);
  }
}
