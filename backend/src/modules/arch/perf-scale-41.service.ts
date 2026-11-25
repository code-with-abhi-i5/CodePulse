/**
 * Architecture Service: V8 JIT Deoptimization Watchdog
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-41]
 */

export interface DeoptEvent {
  fnName: string;
  reason: 'eager' | 'lazy' | 'soft' | 'bailout';
  timestamp: number;
  bailoutReason?: string;
}

export interface DeoptAlert {
  fnName: string;
  deoptCount: number;
  lastReason: string;
  triggeredAt: number;
}

export class V8JitDeoptWatchdogService {
  private events: DeoptEvent[];
  private counts: Map<string, number>;
  private thresholdCount: number;

  constructor(thresholdCount: number = 3) {
    this.events = [];
    this.counts = new Map();
    this.thresholdCount = thresholdCount;
  }

  public recordDeopt(fnName: string, reason: 'eager' | 'lazy' | 'soft' | 'bailout', bailoutReason?: string): DeoptAlert | null {
    const event: DeoptEvent = {
      fnName,
      reason,
      timestamp: Date.now(),
      bailoutReason
    };
    this.events.push(event);

    const count = (this.counts.get(fnName) || 0) + 1;
    this.counts.set(fnName, count);

    if (count >= this.thresholdCount) {
      return {
        fnName,
        deoptCount: count,
        lastReason: bailoutReason || reason,
        triggeredAt: event.timestamp
      };
    }
    return null;
  }

  public getDeoptCount(fnName: string): number {
    return this.counts.get(fnName) || 0;
  }

  public getHotDeoptimizedFunctions(): string[] {
    const hot: string[] = [];
    for (const [fn, count] of this.counts.entries()) {
      if (count >= this.thresholdCount) {
        hot.push(fn);
      }
    }
    return hot;
  }

  public reset(): void {
    this.events = [];
    this.counts.clear();
  }
}
