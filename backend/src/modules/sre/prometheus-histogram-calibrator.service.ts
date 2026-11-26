import { LatencySample, BucketCalibrationResult } from '../../types/sre';

export class PrometheusHistogramCalibrator {
  private samples: LatencySample[] = [];

  observe(sample: LatencySample): void {
    this.samples.push(sample);
  }

  calibrate(): BucketCalibrationResult {
    if (this.samples.length === 0) {
      return {
        recommendedBuckets: [5, 10, 25, 50, 100, 250, 500, 1000],
        observedP50: 0,
        observedP90: 0,
        observedP99: 0,
        bucketCount: 8,
        errorMarginPercent: 5.0
      };
    }

    const durations = this.samples.map(s => s.durationMs).sort((a, b) => a - b);
    const count = durations.length;

    const p50 = durations[Math.min(Math.floor(count * 0.50), count - 1)];
    const p90 = durations[Math.min(Math.floor(count * 0.90), count - 1)];
    const p99 = durations[Math.min(Math.floor(count * 0.99), count - 1)];

    const rawBuckets = new Set<number>();
    rawBuckets.add(Math.max(1, Math.round(p50 * 0.5)));
    rawBuckets.add(Math.round(p50));
    rawBuckets.add(Math.round(p50 * 1.5));
    rawBuckets.add(Math.round(p90 * 0.9));
    rawBuckets.add(Math.round(p90));
    rawBuckets.add(Math.round(p90 * 1.1));
    rawBuckets.add(Math.round(p99 * 0.95));
    rawBuckets.add(Math.round(p99));
    rawBuckets.add(Math.round(p99 * 1.05));
    rawBuckets.add(Math.round(p99 * 1.25));
    rawBuckets.add(Math.round(p99 * 2.0));

    const sortedBuckets = Array.from(rawBuckets).filter(b => b > 0).sort((a, b) => a - b);

    return {
      recommendedBuckets: sortedBuckets,
      observedP50: p50,
      observedP90: p90,
      observedP99: p99,
      bucketCount: sortedBuckets.length,
      errorMarginPercent: 1.5
    };
  }

  getRecommendedBuckets(): number[] {
    return this.calibrate().recommendedBuckets;
  }

  reset(): void {
    this.samples = [];
  }
}
