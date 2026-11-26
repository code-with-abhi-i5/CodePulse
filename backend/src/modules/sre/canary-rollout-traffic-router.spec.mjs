import test from 'node:test';
import assert from 'node:assert/strict';

class CanaryRolloutTrafficRouter {
  constructor(initialWeight = 5, maxDelta = 0.5) {
    this.currentWeightPercent = initialWeight;
    this.maxAllowedErrorDeltaPercent = maxDelta;
  }

  evaluateNextStep(baseline, canary) {
    const baselineErrorRate = baseline.requestCount > 0 ? (baseline.errorCount / baseline.requestCount) * 100 : 0;
    const canaryErrorRate = canary.requestCount > 0 ? (canary.errorCount / canary.requestCount) * 100 : 0;

    if (canaryErrorRate - baselineErrorRate > this.maxAllowedErrorDeltaPercent) {
      this.currentWeightPercent = 0;
      return {
        trafficWeightPercent: 0,
        action: 'rollback',
        canaryErrorRate: Math.round(canaryErrorRate * 100) / 100,
        baselineErrorRate: Math.round(baselineErrorRate * 100) / 100,
        reason: `Rollback triggered: Canary error rate exceeds baseline`
      };
    }

    let nextWeight = this.currentWeightPercent;
    if (this.currentWeightPercent < 100) {
      nextWeight = Math.min(100, this.currentWeightPercent + 20);
      this.currentWeightPercent = nextWeight;
    }

    return {
      trafficWeightPercent: nextWeight,
      action: 'advance',
      canaryErrorRate: Math.round(canaryErrorRate * 100) / 100,
      baselineErrorRate: Math.round(baselineErrorRate * 100) / 100,
      reason: `Canary healthy: advanced traffic weight to ${nextWeight}%`
    };
  }

  reset() {
    this.currentWeightPercent = 5;
  }
}

test('CanaryRolloutTrafficRouter - advances healthy canary and rolls back on error elevation', () => {
  const router = new CanaryRolloutTrafficRouter(10, 0.5);

  const baseline = { version: 'v1.0.0', requestCount: 1000, errorCount: 2, p99LatencyMs: 120 };
  const healthyCanary = { version: 'v1.1.0', requestCount: 100, errorCount: 0, p99LatencyMs: 110 };

  const step1 = router.evaluateNextStep(baseline, healthyCanary);
  assert.strictEqual(step1.action, 'advance');
  assert.strictEqual(step1.trafficWeightPercent, 30);

  const failingCanary = { version: 'v1.1.0', requestCount: 100, errorCount: 10, p99LatencyMs: 400 };
  const step2 = router.evaluateNextStep(baseline, failingCanary);
  assert.strictEqual(step2.action, 'rollback');
  assert.strictEqual(step2.trafficWeightPercent, 0);
});
