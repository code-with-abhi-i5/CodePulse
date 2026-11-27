export interface InactivityConfig {
  sessionDurationSec: number; // e.g. 1800 (30m)
  warningWindowSec: number;    // e.g. 300 (5m)
}

export class InactivityWarningSentinelService {
  private lastActivityTs: number;
  private sessionDurationSec: number;
  private warningWindowSec: number;

  constructor(config: Partial<InactivityConfig> = {}) {
    this.sessionDurationSec = config.sessionDurationSec || 1800;
    this.warningWindowSec = config.warningWindowSec || 300;
    this.lastActivityTs = Date.now();
  }

  public recordActivity(now = Date.now()): void {
    this.lastActivityTs = now;
  }

  public evaluateSessionStatus(now = Date.now()): { status: 'ACTIVE' | 'WARNING' | 'EXPIRED'; remainingSec: number } {
    const elapsedSec = Math.floor((now - this.lastActivityTs) / 1000);
    const remainingSec = Math.max(0, this.sessionDurationSec - elapsedSec);

    if (remainingSec === 0) {
      return { status: 'EXPIRED', remainingSec: 0 };
    }

    if (remainingSec <= this.warningWindowSec) {
      return { status: 'WARNING', remainingSec };
    }

    return { status: 'ACTIVE', remainingSec };
  }

  public extendSession(now = Date.now()): void {
    this.lastActivityTs = now;
  }
}
