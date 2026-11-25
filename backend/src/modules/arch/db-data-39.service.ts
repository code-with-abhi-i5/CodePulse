/**
 * Architecture Service: Database Failover Connection Switcher
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-39]
 */

export class DatabaseFailoverSwitcherService {
  private activeConnectionString: string;
  private standbyConnectionString: string;
  private consecutiveFailures: number;
  private failoverThreshold: number;

  constructor(
    primaryUrl: string,
    standbyUrl: string,
    failoverThreshold: number = 3
  ) {
    this.activeConnectionString = primaryUrl;
    this.standbyConnectionString = standbyUrl;
    this.consecutiveFailures = 0;
    this.failoverThreshold = failoverThreshold;
  }

  public recordHealthCheck(isAlive: boolean): { failedOver: boolean; currentActive: string } {
    if (isAlive) {
      this.consecutiveFailures = 0;
      return { failedOver: false, currentActive: this.activeConnectionString };
    }

    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.failoverThreshold && this.activeConnectionString !== this.standbyConnectionString) {
      // Execute seamless failover
      this.activeConnectionString = this.standbyConnectionString;
      return { failedOver: true, currentActive: this.activeConnectionString };
    }

    return { failedOver: false, currentActive: this.activeConnectionString };
  }

  public getActiveConnection(): string {
    return this.activeConnectionString;
  }
}
