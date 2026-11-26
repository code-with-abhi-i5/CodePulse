import test from 'node:test';
import assert from 'node:assert/strict';

class ReleaseTagRollbackRunner {
  constructor(maxErrorRatePercent = 2.0, maxP99LatencyMs = 500) {
    this.maxErrorRatePercent = maxErrorRatePercent;
    this.maxP99LatencyMs = maxP99LatencyMs;
  }

  evaluateCanary(metrics, previousStableTag) {
    if (metrics.errorRatePercent > this.maxErrorRatePercent) {
      return {
        shouldRollback: true,
        reason: `Error rate ${metrics.errorRatePercent}% exceeded threshold ${this.maxErrorRatePercent}%`,
        targetTag: previousStableTag
      };
    }

    if (metrics.p99LatencyMs > this.maxP99LatencyMs) {
      return {
        shouldRollback: true,
        reason: `P99 latency ${metrics.p99LatencyMs}ms exceeded threshold ${this.maxP99LatencyMs}ms`,
        targetTag: previousStableTag
      };
    }

    if (metrics.healthyReplicas <= 0) {
      return {
        shouldRollback: true,
        reason: 'Zero healthy replicas detected in canary deployment',
        targetTag: previousStableTag
      };
    }

    return {
      shouldRollback: false,
      targetTag: previousStableTag
    };
  }
}

test('ReleaseTagRollbackRunner - triggers automated rollback upon SLO breaches', () => {
  const runner = new ReleaseTagRollbackRunner(2.0, 500);

  const healthy = runner.evaluateCanary({ errorRatePercent: 0.5, p99LatencyMs: 250, healthyReplicas: 3 }, 'v2.4.1');
  assert.strictEqual(healthy.shouldRollback, false);

  const highError = runner.evaluateCanary({ errorRatePercent: 4.8, p99LatencyMs: 200, healthyReplicas: 3 }, 'v2.4.1');
  assert.strictEqual(highError.shouldRollback, true);
  assert.match(highError.reason, /Error rate 4.8% exceeded/);

  const slow = runner.evaluateCanary({ errorRatePercent: 1.0, p99LatencyMs: 850, healthyReplicas: 3 }, 'v2.4.1');
  assert.strictEqual(slow.shouldRollback, true);
  assert.match(slow.reason, /P99 latency 850ms exceeded/);
});
