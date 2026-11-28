import test from 'node:test';
import assert from 'node:assert/strict';

class EbpfSocketLatencyProbe {
  constructor(thresholdMs = 10.0) {
    this.probes = [];
    this.latencyThresholdMs = thresholdMs;
  }

  recordProbe(probe) {
    this.probes.push(probe);
    if (this.probes.length > 50) this.probes.shift();
  }

  getLinkStatus(source, destination) {
    const matching = this.probes.filter(p => p.sourceService === source && p.destinationService === destination);
    if (matching.length === 0) {
      return { p95RttMs: 0, jitterMs: 0, isDegraded: false, recommendation: 'No probe data recorded' };
    }

    const rttsMs = matching.map(p => p.rttMicroseconds / 1000).sort((a, b) => a - b);
    const p95 = rttsMs[Math.min(Math.floor(rttsMs.length * 0.95), rttsMs.length - 1)];

    const jittersMs = matching.map(p => p.jitterMicroseconds / 1000);
    const avgJitter = jittersMs.reduce((a, b) => a + b, 0) / jittersMs.length;

    const isDegraded = p95 >= this.latencyThresholdMs;
    const recommendation = isDegraded
      ? `Degraded RTT of ${p95.toFixed(2)}ms between ${source} and ${destination}`
      : 'Kernel socket round-trip latency within acceptable SLO margins';

    return {
      p95RttMs: Math.round(p95 * 100) / 100,
      jitterMs: Math.round(avgJitter * 100) / 100,
      isDegraded,
      recommendation
    };
  }

  reset() {
    this.probes = [];
  }
}

test('EbpfSocketLatencyProbe - tracks kernel TCP socket RTT and flags degraded inter-service links', () => {
  const probe = new EbpfSocketLatencyProbe(10.0);

  probe.recordProbe({ sourceService: 'api-gw', destinationService: 'redis', rttMicroseconds: 800, jitterMicroseconds: 50, timestamp: Date.now() });
  probe.recordProbe({ sourceService: 'api-gw', destinationService: 'redis', rttMicroseconds: 1200, jitterMicroseconds: 80, timestamp: Date.now() });

  const statusNormal = probe.getLinkStatus('api-gw', 'redis');
  assert.strictEqual(statusNormal.isDegraded, false);

  probe.recordProbe({ sourceService: 'api-gw', destinationService: 'redis', rttMicroseconds: 18000, jitterMicroseconds: 4000, timestamp: Date.now() });
  const statusDegraded = probe.getLinkStatus('api-gw', 'redis');
  assert.strictEqual(statusDegraded.isDegraded, true);
  assert.ok(statusDegraded.p95RttMs >= 10.0);
});
