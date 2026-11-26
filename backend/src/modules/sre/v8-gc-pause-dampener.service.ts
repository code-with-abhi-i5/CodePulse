import { GcPauseEvent, GcDampenerStatus } from '../../types/sre';

export class V8GcPauseDampener {
  private events: GcPauseEvent[] = [];
  private readonly maxLatencyThresholdMs: number = 15;
  private readonly windowSize: number = 20;

  recordEvent(event: GcPauseEvent): void {
    this.events.push(event);
    if (this.events.length > this.windowSize) {
      this.events.shift();
    }
  }

  getStatus(): GcDampenerStatus {
    if (this.events.length === 0) {
      return {
        totalEvents: 0,
        averagePauseMs: 0,
        p95PauseMs: 0,
        isThrottled: false,
        suggestIncremental: false,
        throttleRatio: 0.0
      };
    }

    const durations = this.events.map(e => e.durationMs).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    const avg = sum / durations.length;

    const p95Index = Math.min(Math.floor(durations.length * 0.95), durations.length - 1);
    const p95 = durations[p95Index];

    const isThrottled = p95 > this.maxLatencyThresholdMs || avg > this.maxLatencyThresholdMs;
    const suggestIncremental = this.events.some(e => e.kind === 'major' && e.durationMs > this.maxLatencyThresholdMs);
    
    let throttleRatio = 0.0;
    if (isThrottled) {
      const excess = Math.max(p95, avg) - this.maxLatencyThresholdMs;
      throttleRatio = Math.min(Math.round((excess / 15) * 100) / 100, 0.8);
    }

    return {
      totalEvents: this.events.length,
      averagePauseMs: Math.round(avg * 100) / 100,
      p95PauseMs: p95,
      isThrottled,
      suggestIncremental,
      throttleRatio
    };
  }

  shouldThrottle(): boolean {
    return this.getStatus().isThrottled;
  }

  reset(): void {
    this.events = [];
  }
}
