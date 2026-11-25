/**
 * Architecture Service: Frontend Idle Timeout Coordinator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-61]
 */

export type IdleState = 'ACTIVE' | 'WARNING' | 'EXPIRED';

export class FrontendIdleTimeoutCoordinatorService {
  private lastActivityTimestamp: number;
  private warningTimeoutMs: number;
  private expiryTimeoutMs: number;

  constructor(warningTimeoutMs: number = 900000, expiryTimeoutMs: number = 1200000) {
    this.lastActivityTimestamp = Date.now();
    this.warningTimeoutMs = warningTimeoutMs;
    this.expiryTimeoutMs = expiryTimeoutMs;
  }

  public recordActivity(now: number = Date.now()): void {
    this.lastActivityTimestamp = now;
  }

  public getState(now: number = Date.now()): IdleState {
    const elapsed = now - this.lastActivityTimestamp;
    if (elapsed >= this.expiryTimeoutMs) {
      return 'EXPIRED';
    }
    if (elapsed >= this.warningTimeoutMs) {
      return 'WARNING';
    }
    return 'ACTIVE';
  }

  public getRemainingSecondsUntilExpiry(now: number = Date.now()): number {
    const elapsed = now - this.lastActivityTimestamp;
    const remainingMs = Math.max(0, this.expiryTimeoutMs - elapsed);
    return Math.ceil(remainingMs / 1000);
  }
}
