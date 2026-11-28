import test from 'node:test';
import assert from 'node:assert/strict';

class MultiModelFallbackRouterService {
  constructor() {
    this.maxLatencyThresholdMs = 2500;
  }

  routeRequest(primaryModel, fallbackModel, currentLatencyMs, circuitBroken) {
    if (circuitBroken) return { routedModel: fallbackModel, isFallback: true, reason: 'error_circuit_open' };
    if (currentLatencyMs > this.maxLatencyThresholdMs) return { routedModel: fallbackModel, isFallback: true, reason: 'latency_spike' };
    return { routedModel: primaryModel, isFallback: false, reason: 'primary_healthy' };
  }
}

test('MultiModelFallbackRouterService - falls back gracefully on latency spike or circuit break', () => {
  const router = new MultiModelFallbackRouterService();
  const fast = router.routeRequest('claude-3-opus', 'claude-3-haiku', 400, false);
  assert.equal(fast.isFallback, false);
  assert.equal(fast.routedModel, 'claude-3-opus');

  const spiked = router.routeRequest('claude-3-opus', 'claude-3-haiku', 3200, false);
  assert.equal(spiked.isFallback, true);
  assert.equal(spiked.reason, 'latency_spike');
});
