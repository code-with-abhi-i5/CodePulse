import { RateLimitMetrics, RateLimitAnomaly } from '../../types/sre';

export class RateLimitAnomalyDetector {
  private zScoreThreshold: number;

  constructor(zScoreThreshold: number = 3.0) {
    this.zScoreThreshold = zScoreThreshold;
  }

  detectAnomaly(metrics: RateLimitMetrics): RateLimitAnomaly {
    if (metrics.historicalStdDev <= 0) {
      return { isAnomaly: false, zScore: 0, severity: 'normal' };
    }

    const zScore = Number(((metrics.requestCount - metrics.historicalMean) / metrics.historicalStdDev).toFixed(2));
    let severity: 'normal' | 'suspicious' | 'critical' = 'normal';
    let isAnomaly = false;

    if (zScore >= this.zScoreThreshold * 1.5) {
      isAnomaly = true;
      severity = 'critical';
    } else if (zScore >= this.zScoreThreshold) {
      isAnomaly = true;
      severity = 'suspicious';
    }

    return { isAnomaly, zScore, severity };
  }
}
