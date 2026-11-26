import { SocketRttProbe, SocketLatencyStatus } from '../../types/sre';

export class EbpfSocketLatencyProbe {
  private probes: SocketRttProbe[] = [];
  private readonly latencyThresholdMs: number = 10.0;

  recordProbe(probe: SocketRttProbe): void {
    this.probes.push(probe);
    if (this.probes.length > 50) this.probes.shift();
  }

  getLinkStatus(source: string, destination: string): SocketLatencyStatus {
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
      ? `Degraded RTT of ${p95.toFixed(2)}ms between ${source} and ${destination}: check node network mesh or CNI MTU`
      : 'Kernel socket round-trip latency within acceptable SLO margins';

    return {
      p95RttMs: Math.round(p95 * 100) / 100,
      jitterMs: Math.round(avgJitter * 100) / 100,
      isDegraded,
      recommendation
    };
  }

  reset(): void {
    this.probes = [];
  }
}
