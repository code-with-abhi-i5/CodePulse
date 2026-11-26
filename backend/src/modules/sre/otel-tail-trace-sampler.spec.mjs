import test from 'node:test';
import assert from 'node:assert/strict';

class OtelTailTraceSampler {
  constructor(latencyThresholdMs = 500, baseSampleRate = 0.05) {
    this.latencyThresholdMs = latencyThresholdMs;
    this.baseSampleRate = baseSampleRate;
  }

  evaluateSpan(span) {
    if (span.hasError || (span.httpStatusCode && span.httpStatusCode >= 500)) {
      return { sample: true, reason: 'error' };
    }

    if (span.durationMs >= this.latencyThresholdMs) {
      return { sample: true, reason: 'high_latency' };
    }

    const hash = span.traceId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const isSampled = (hash % 100) < (this.baseSampleRate * 100);

    return {
      sample: isSampled,
      reason: isSampled ? 'probabilistic' : 'dropped'
    };
  }
}

test('OtelTailTraceSampler - retains 100% of error and high-latency traces', () => {
  const sampler = new OtelTailTraceSampler(500, 0.05);

  const errorSpan = { traceId: 'trace-err-1', spanId: 's1', serviceName: 'battle-api', durationMs: 40, hasError: true };
  assert.strictEqual(sampler.evaluateSpan(errorSpan).sample, true);
  assert.strictEqual(sampler.evaluateSpan(errorSpan).reason, 'error');

  const slowSpan = { traceId: 'trace-slow-2', spanId: 's2', serviceName: 'compiler', durationMs: 750, hasError: false };
  assert.strictEqual(sampler.evaluateSpan(slowSpan).sample, true);
  assert.strictEqual(sampler.evaluateSpan(slowSpan).reason, 'high_latency');
});
