export class SessionInactivityWarningVerifier {
  private lastActivity: number;
  private timeoutMs: number;
  private warningMs: number;

  constructor(timeoutMs = 1800000, warningMs = 300000) {
    this.timeoutMs = timeoutMs;
    this.warningMs = warningMs;
    this.lastActivity = Date.now();
  }

  public touch(now = Date.now()): void {
    this.lastActivity = now;
  }

  public checkWarning(now = Date.now()): { shouldWarn: boolean; shouldLogout: boolean; remainingMs: number } {
    const elapsed = now - this.lastActivity;
    const remainingMs = Math.max(0, this.timeoutMs - elapsed);

    if (remainingMs === 0) {
      return { shouldWarn: false, shouldLogout: true, remainingMs: 0 };
    }

    if (remainingMs <= this.warningMs) {
      return { shouldWarn: true, shouldLogout: false, remainingMs };
    }

    return { shouldWarn: false, shouldLogout: false, remainingMs };
  }
}
