/**
 * Architecture Service: TCP Socket Backlog Optimizer
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-06]
 */

export type BacklogHealth = 'OPTIMAL' | 'STRESSED' | 'SATURATED';

export class TcpSocketBacklogOptimizerService {
  private backlogCapacity: number;
  private pendingSynQueue: number;

  constructor(backlogCapacity: number = 1024) {
    this.backlogCapacity = backlogCapacity;
    this.pendingSynQueue = 0;
  }

  public recordIncomingSyn(): boolean {
    if (this.pendingSynQueue >= this.backlogCapacity) {
      return false; // Dropped
    }
    this.pendingSynQueue++;
    return true;
  }

  public recordConnectionAccepted(): void {
    if (this.pendingSynQueue > 0) {
      this.pendingSynQueue--;
    }
  }

  public getUtilization(): number {
    return Math.round((this.pendingSynQueue / this.backlogCapacity) * 100);
  }

  public getHealth(): BacklogHealth {
    const util = this.getUtilization();
    if (util >= 90) return 'SATURATED';
    if (util >= 70) return 'STRESSED';
    return 'OPTIMAL';
  }

  public shouldShedTraffic(): boolean {
    return this.getHealth() === 'SATURATED';
  }
}
