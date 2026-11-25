/**
 * Architecture Service: Database Connection Leak Watchdog
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-26]
 */

export interface LeaseRecord {
  connectionId: string;
  checkedOutAt: number;
  stackTrace: string;
}

export class DatabaseConnectionLeakWatchdogService {
  private activeLeases: Map<string, LeaseRecord>;
  private maxLeaseDurationMs: number;

  constructor(maxLeaseDurationMs: number = 5000) {
    this.activeLeases = new Map();
    this.maxLeaseDurationMs = maxLeaseDurationMs;
  }

  public checkoutConnection(connectionId: string): void {
    const stack = new Error().stack || 'No stack available';
    this.activeLeases.set(connectionId, {
      connectionId,
      checkedOutAt: Date.now(),
      stackTrace: stack
    });
  }

  public releaseConnection(connectionId: string): void {
    this.activeLeases.delete(connectionId);
  }

  public detectLeaks(now: number = Date.now()): Array<LeaseRecord & { exceededMs: number }> {
    const leaks: Array<LeaseRecord & { exceededMs: number }> = [];

    for (const lease of this.activeLeases.values()) {
      const elapsed = now - lease.checkedOutAt;
      if (elapsed > this.maxLeaseDurationMs) {
        leaks.push({
          ...lease,
          exceededMs: elapsed - this.maxLeaseDurationMs
        });
      }
    }

    return leaks;
  }
}
