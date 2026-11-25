/**
 * Architecture Service: Database Statement Timeout Auto-Escalator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-51]
 */

export class DatabaseStatementTimeoutAutoEscalatorService {
  private baseTimeoutMs: number;
  private minTimeoutMs: number;

  constructor(baseTimeoutMs: number = 10000, minTimeoutMs: number = 2000) {
    this.baseTimeoutMs = baseTimeoutMs;
    this.minTimeoutMs = minTimeoutMs;
  }

  public calculateTimeout(cpuUsagePercent: number, activeConnectionsPercent: number): number {
    const loadFactor = Math.max(cpuUsagePercent, activeConnectionsPercent) / 100;

    if (loadFactor >= 0.85) {
      // Under heavy load (>=85%), throttle timeout to protect database
      return this.minTimeoutMs;
    } else if (loadFactor >= 0.7) {
      return Math.round(this.baseTimeoutMs * 0.5);
    }

    return this.baseTimeoutMs;
  }
}
