import { Injectable, Logger } from '@nestjs/common';

export interface RunningDistributionStats {
  count: number;
  mean: number;
  m2: number; // Sum of squared differences from the mean (Welford's algorithm)
  variance: number;
  stdDev: number;
}

@Injectable()
export class ZscoreNormalizerService {
  private readonly logger = new Logger(ZscoreNormalizerService.name);

  // Streaming distribution stats keyed by shard identifier (e.g. "algorithms:GLOBAL")
  private readonly distributions = new Map<string, RunningDistributionStats>();

  /**
   * Updates streaming distribution using Welford's algorithm for numerical stability.
   */
  public updateDistribution(shardKey: string, newScore: number): RunningDistributionStats {
    let stats = this.distributions.get(shardKey);
    if (!stats) {
      stats = { count: 0, mean: 0, m2: 0, variance: 0, stdDev: 0 };
      this.distributions.set(shardKey, stats);
    }

    stats.count++;
    const delta = newScore - stats.mean;
    stats.mean += delta / stats.count;
    const delta2 = newScore - stats.mean;
    stats.m2 += delta * delta2;

    stats.variance = stats.count > 1 ? stats.m2 / (stats.count - 1) : 0;
    stats.stdDev = Math.sqrt(stats.variance);

    return { ...stats };
  }

  /**
   * Computes Z-score = (x - mean) / stdDev.
   */
  public calculateZScore(shardKey: string, score: number): number {
    const stats = this.distributions.get(shardKey);
    if (!stats || stats.stdDev === 0) {
      return 0; // Baseline
    }

    const z = (score - stats.mean) / stats.stdDev;
    return Number(z.toFixed(3));
  }

  /**
   * Estimates cumulative distribution function (CDF) percentile: Phi(z) * 100%.
   * Uses error function approximation (Abramowitz and Stegun).
   */
  public calculatePercentile(shardKey: string, score: number): number {
    const z = this.calculateZScore(shardKey, score);
    const cdf = this.normalCdf(z);
    return Math.max(0.1, Math.min(99.9, Number((cdf * 100).toFixed(2))));
  }

  public getDistribution(shardKey: string): RunningDistributionStats | undefined {
    const stats = this.distributions.get(shardKey);
    return stats ? { ...stats } : undefined;
  }

  private normalCdf(z: number): number {
    // Standard normal CDF approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1.0 / (1.0 + p * x);
    const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * erf);
  }

  public clear(): void {
    this.distributions.clear();
  }
}
