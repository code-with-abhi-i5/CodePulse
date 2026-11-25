/**
 * Architecture Service: V8 Garbage Collection Pause Time Dampener
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-09]
 */

export interface GcEvent {
  type: 'minor' | 'major';
  pauseMs: number;
  timestamp: number;
}

export class V8GcPauseTimeDampenerService {
  private events: GcEvent[];
  private pauseLimitMs: number;

  constructor(pauseLimitMs: number = 10) {
    this.events = [];
    this.pauseLimitMs = pauseLimitMs;
  }

  public recordGcEvent(type: 'minor' | 'major', pauseMs: number, timestamp: number = Date.now()): void {
    this.events.push({ type, pauseMs, timestamp });
    if (this.events.length > 50) {
      this.events.shift();
    }
  }

  public getAverageMajorPauseMs(): number {
    const majors = this.events.filter(e => e.type === 'major');
    if (majors.length === 0) return 0;
    const sum = majors.reduce((a, b) => a + b.pauseMs, 0);
    return Math.round((sum / majors.length) * 100) / 100;
  }

  public isViolatingPauseThreshold(): boolean {
    const recent = this.events.slice(-5);
    return recent.some(e => e.pauseMs > this.pauseLimitMs);
  }
}
