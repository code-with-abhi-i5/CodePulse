import { DbCircuitBreakerMetrics } from '../../types/db';

export class DatabaseCircuitBreakerService {
  private windowQueries: boolean[] = [];
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastStateChange = Date.now();
  private readonly cooldownMs = 5000;
  private readonly errorRateThreshold = 0.50;

  recordQuery(isSuccess: boolean): void {
    this.windowQueries.push(isSuccess);
    if (this.windowQueries.length > 20) {
      this.windowQueries.shift();
    }
    this.evaluateState();
  }

  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastStateChange > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = Date.now();
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN allows single test probe
  }

  getMetrics(): DbCircuitBreakerMetrics {
    const total = this.windowQueries.length;
    const errors = this.windowQueries.filter(s => !s).length;
    const rate = total === 0 ? 0 : Math.round((errors / total) * 100);

    return {
      totalQueries: total,
      errorCount: errors,
      errorRatePercentage: rate,
      circuitState: this.state
    };
  }

  private evaluateState(): void {
    const total = this.windowQueries.length;
    if (total < 5) return;

    const errors = this.windowQueries.filter(s => !s).length;
    const errorRate = errors / total;

    if (this.state === 'CLOSED' && errorRate >= this.errorRateThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
    } else if (this.state === 'HALF_OPEN') {
      if (errorRate < 0.20) {
        this.state = 'CLOSED';
      } else {
        this.state = 'OPEN';
        this.lastStateChange = Date.now();
      }
    }
  }
}
