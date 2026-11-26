import test from 'node:test';
import assert from 'node:assert/strict';

class V8GcPauseDampener {
  constructor() {
    this.events = [];
    this.maxLatencyThresholdMs = 15;
    this.windowSize = 20;
  }

  recordEvent(event) {
    this.events.push(event);
    if (this.events.length > this.windowSize) {
      this.events.shift();
    }
  }

  getStatus() {
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

  shouldThrottle() {
    return this.getStatus().isThrottled;
  }

  reset() {
    this.events = [];
  }
}

test('V8GcPauseDampener - tracks GC events and enforces sub-15ms pause latency', () => {
  const dampener = new V8GcPauseDampener();
  assert.strictEqual(dampener.getStatus().totalEvents, 0);
  assert.strictEqual(dampener.shouldThrottle(), false);

  dampener.recordEvent({ kind: 'minor', durationMs: 5, timestamp: Date.now() });
  dampener.recordEvent({ kind: 'minor', durationMs: 8, timestamp: Date.now() });
  assert.strictEqual(dampener.shouldThrottle(), false);

  for (let i = 0; i < 5; i++) {
    dampener.recordEvent({ kind: 'major', durationMs: 25, timestamp: Date.now() });
  }

  const status = dampener.getStatus();
  assert.strictEqual(status.isThrottled, true);
  assert.strictEqual(status.suggestIncremental, true);
  assert.ok(status.throttleRatio > 0);

  dampener.reset();
  assert.strictEqual(dampener.getStatus().totalEvents, 0);
  assert.strictEqual(dampener.shouldThrottle(), false);
});
