import test from 'node:test';
import assert from 'node:assert/strict';

class EventLoopLatencyWatchdog {
  constructor(saturationThresholdMs = 20.0) {
    this.samples = [];
    this.saturationThresholdMs = saturationThresholdMs;
  }

  recordLag(expectedIntervalMs, actualDurationMs) {
    const lagMs = Math.max(0, actualDurationMs - expectedIntervalMs);
    this.samples.push({
      expectedIntervalMs,
      actualDurationMs,
      lagMs,
      timestamp: Date.now()
    });
    if (this.samples.length > 50) this.samples.shift();
  }

  getStatus() {
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

  reset() {
    this.samples = [];
  }
}

test('EventLoopLatencyWatchdog - computes p99 lag and flags event loop saturation', () => {
  const watchdog = new EventLoopLatencyWatchdog(20.0);
  assert.strictEqual(watchdog.getStatus().isSaturated, false);

  for (let i = 0; i < 20; i++) {
    watchdog.recordLag(10, 12); // 2ms lag
  }
  assert.strictEqual(watchdog.getStatus().isSaturated, false);

  watchdog.recordLag(10, 45); // 35ms lag spike
  const status = watchdog.getStatus();
  assert.strictEqual(status.isSaturated, true);
  assert.ok(status.p99LagMs >= 20.0);
});
