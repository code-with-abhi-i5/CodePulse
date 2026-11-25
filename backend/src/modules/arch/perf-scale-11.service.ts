/**
 * Architecture Service: Thread Pool Autoscaler
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-11]
 */

export interface AutoscalerStats {
  currentWorkers: number;
  minWorkers: number;
  maxWorkers: number;
  lastLagMs: number;
  lastScalingAction: 'UP' | 'DOWN' | 'NONE';
}

export class ThreadPoolAutoscalerService {
  private minWorkers: number;
  private maxWorkers: number;
  private currentWorkers: number;
  private lastScalingAction: 'UP' | 'DOWN' | 'NONE';

  constructor(minWorkers: number = 2, maxWorkers: number = 16, initialWorkers: number = 4) {
    this.minWorkers = minWorkers;
    this.maxWorkers = maxWorkers;
    this.currentWorkers = Math.max(minWorkers, Math.min(maxWorkers, initialWorkers));
    this.lastScalingAction = 'NONE';
  }

  public adjustPool(eventLoopLagMs: number): number {
    if (eventLoopLagMs > 50 && this.currentWorkers > this.minWorkers) {
      this.currentWorkers = Math.max(this.minWorkers, this.currentWorkers - 1);
      this.lastScalingAction = 'DOWN';
    } else if (eventLoopLagMs < 15 && this.currentWorkers < this.maxWorkers) {
      this.currentWorkers = Math.min(this.maxWorkers, this.currentWorkers + 1);
      this.lastScalingAction = 'UP';
    } else {
      this.lastScalingAction = 'NONE';
    }
    return this.currentWorkers;
  }

  public getStats(lastLagMs: number = 0): AutoscalerStats {
    return {
      currentWorkers: this.currentWorkers,
      minWorkers: this.minWorkers,
      maxWorkers: this.maxWorkers,
      lastLagMs,
      lastScalingAction: this.lastScalingAction
    };
  }
}
