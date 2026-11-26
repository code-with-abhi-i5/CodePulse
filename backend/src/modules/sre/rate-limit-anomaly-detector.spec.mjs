import test from 'node:test';
import assert from 'node:assert/strict';

class RateLimitAnomalyDetector {
  constructor(zScoreThreshold = 3.0) {
    this.zScoreThreshold = zScoreThreshold;
  }

  detectAnomaly(metrics) {
    if (metrics.historicalStdDev <= 0) {
      return { isAnomaly: false, zScore: 0, severity: 'normal' };
    }

    const zScore = Number(((metrics.requestCount - metrics.historicalMean) / metrics.historicalStdDev).toFixed(2));
    let severity = 'normal';
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

test('RateLimitAnomalyDetector - flags anomalous traffic spikes via z-score evaluation', () => {
  const detector = new RateLimitAnomalyDetector(3.0);
  const normal = detector.detectAnomaly({ tenantId: 't1', requestCount: 120, historicalMean: 100, historicalStdDev: 15 });
  assert.strictEqual(normal.isAnomaly, false);

  const spike = detector.detectAnomaly({ tenantId: 't2', requestCount: 220, historicalMean: 100, historicalStdDev: 15 });
  assert.strictEqual(spike.isAnomaly, true);
  assert.strictEqual(spike.severity, 'critical');
});
