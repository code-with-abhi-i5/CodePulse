/**
 * Architecture Service: Event Loop Latency Watchdog
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-15]
 */

export class EventLoopLatencyWatchdogService {
  private shedThresholdMs: number;
  private currentLagMs: number;
  private totalShedRequests: number;

  constructor(shedThresholdMs: number = 50) {
    this.shedThresholdMs = shedThresholdMs;
    this.currentLagMs = 0;
    this.totalShedRequests = 0;
  }

  public recordLag(lagMs: number): void {
    this.currentLagMs = lagMs;
  }

  public shouldShedRequest(isCritical: boolean = false): boolean {
    if (isCritical) return false; // Never shed critical auth/payment
    if (this.currentLagMs > this.shedThresholdMs) {
      this.totalShedRequests++;
      return true;
    }
    return false;
  }

  public getStats(): { currentLagMs: number; shedThresholdMs: number; totalShedRequests: number } {
    return {
      currentLagMs: this.currentLagMs,
      shedThresholdMs: this.shedThresholdMs,
      totalShedRequests: this.totalShedRequests
    };
  }
}
