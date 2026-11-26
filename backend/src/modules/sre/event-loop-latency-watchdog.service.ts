import { EventLoopLagSample, EventLoopLagStatus } from '../../types/sre';

export class EventLoopLatencyWatchdog {
  private samples: EventLoopLagSample[] = [];
  private readonly saturationThresholdMs: number = 20.0;

  recordLag(expectedIntervalMs: number, actualDurationMs: number): void {
    const lagMs = Math.max(0, actualDurationMs - expectedIntervalMs);
    this.samples.push({
      expectedIntervalMs,
      actualDurationMs,
      lagMs,
      timestamp: Date.now()
    });
    if (this.samples.length > 50) this.samples.shift();
  }

  getStatus(): EventLoopLagStatus {
    if (this.samples.length === 0) {
      return { sampleCount: 0, p50LagMs: 0, p99LagMs: 0, isSaturated: false };
    }

    const lags = this.samples.map(s => s.lagMs).sort((a, b) => a - b);
    const p50 = lags[Math.floor(lags.length * 0.5)];
    const p99 = lags[Math.min(Math.floor(lags.length * 0.99), lags.length - 1)];

    return {
      sampleCount: this.samples.length,
      p50LagMs: Math.round(p50 * 100) / 100,
      p99LagMs: Math.round(p99 * 100) / 100,
      isSaturated: p99 >= this.saturationThresholdMs
    };
  }

  reset(): void {
    this.samples = [];
  }
}
