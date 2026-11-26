import { RumBeacon, CoreWebVitalsReport } from '../../types/sre';

export class ClientRumBeaconProcessor {
  private beacons: RumBeacon[] = [];

  recordBeacon(beacon: RumBeacon): void {
    this.beacons.push(beacon);
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * p);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  computeReport(): CoreWebVitalsReport {
    if (this.beacons.length === 0) {
      return { sampleCount: 0, p75LcpMs: 0, p75FidMs: 0, p75ClsScore: 0, overallHealth: 'good' };
    }

    const lcps = this.beacons.map(b => b.lcpMs);
    const fids = this.beacons.map(b => b.fidMs);
    const clss = this.beacons.map(b => b.clsScore);

    const p75LcpMs = this.percentile(lcps, 0.75);
    const p75FidMs = this.percentile(fids, 0.75);
    const p75ClsScore = Number(this.percentile(clss, 0.75).toFixed(3));

    let overallHealth: 'good' | 'needs_improvement' | 'poor' = 'good';
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
