import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WorkerAutoscalerService {
  constructor() {
    this.latencies = new Map();
    this.minConcurrency = 2;
    this.maxConcurrency = 50;
  }

  recordMetric(queue, latencyMs) {
    if (!this.latencies.has(queue)) {
      this.latencies.set(queue, []);
    }
    const list = this.latencies.get(queue);
    list.push(latencyMs);
    if (list.length > 1000) list.shift();
  }

  getPercentiles(queue) {
    const list = this.latencies.get(queue);
    if (!list || list.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const sorted = [...list].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  calculateTargetConcurrency(currentConcurrency, p95LatencyMs, queueDepth) {
    let target = currentConcurrency;
    if (p95LatencyMs > 2000 || queueDepth > 500) {
      target = Math.min(this.maxConcurrency, Math.ceil(currentConcurrency * 1.5));
    } else if (p95LatencyMs < 300 && queueDepth < 10) {
      target = Math.max(this.minConcurrency, Math.floor(currentConcurrency * 0.8));
    }
    return target;
  }
}

describe('WorkerAutoscalerService', () => {
  it('accurately calculates percentiles and scales concurrency based on load', () => {
    const service = new WorkerAutoscalerService();
    for (let i = 1; i <= 100; i++) {
      service.recordMetric('battles', i * 20);
    }
    const metrics = service.getPercentiles('battles');
    assert.ok(metrics.p95 >= 1800);

    const scaledUp = service.calculateTargetConcurrency(10, metrics.p95 + 500, 600);
    assert.equal(scaledUp, 15);

    const scaledDown = service.calculateTargetConcurrency(10, 150, 2);
    assert.equal(scaledDown, 8);
  });
});
