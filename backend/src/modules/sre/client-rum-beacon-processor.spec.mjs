import test from 'node:test';
import assert from 'node:assert/strict';

class ClientRumBeaconProcessor {
  constructor() {
    this.beacons = [];
  }

  recordBeacon(beacon) {
    this.beacons.push(beacon);
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * p);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  computeReport() {
    if (this.beacons.length === 0) {
      return { sampleCount: 0, p75LcpMs: 0, p75FidMs: 0, p75ClsScore: 0, overallHealth: 'good' };
    }

    const lcps = this.beacons.map(b => b.lcpMs);
    const fids = this.beacons.map(b => b.fidMs);
    const clss = this.beacons.map(b => b.clsScore);

    const p75LcpMs = this.percentile(lcps, 0.75);
    const p75FidMs = this.percentile(fids, 0.75);
    const p75ClsScore = Number(this.percentile(clss, 0.75).toFixed(3));

    let overallHealth = 'good';
    if (p75LcpMs > 4000 || p75FidMs > 300 || p75ClsScore > 0.25) {
      overallHealth = 'poor';
    } else if (p75LcpMs > 2500 || p75FidMs > 100 || p75ClsScore > 0.1) {
      overallHealth = 'needs_improvement';
    }

    return {
      sampleCount: this.beacons.length,
      p75LcpMs,
      p75FidMs,
      p75ClsScore,
      overallHealth
    };
  }
}

test('ClientRumBeaconProcessor - calculates p75 Web Vitals and classifies UX health', () => {
  const proc = new ClientRumBeaconProcessor();
  proc.recordBeacon({ page: '/battle', lcpMs: 1800, fidMs: 40, clsScore: 0.05, ttfbMs: 200, timestamp: Date.now() });
  proc.recordBeacon({ page: '/battle', lcpMs: 2200, fidMs: 60, clsScore: 0.08, ttfbMs: 250, timestamp: Date.now() });
  proc.recordBeacon({ page: '/battle', lcpMs: 3100, fidMs: 120, clsScore: 0.12, ttfbMs: 350, timestamp: Date.now() });

  const report = proc.computeReport();
  assert.strictEqual(report.sampleCount, 3);
  assert.strictEqual(report.overallHealth, 'needs_improvement');
});
