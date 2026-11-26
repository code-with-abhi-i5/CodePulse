import { CanaryHealthMetrics, RollbackDecision } from '../../types/sre';

export class ReleaseTagRollbackRunner {
  private maxErrorRatePercent: number;
  private maxP99LatencyMs: number;

  constructor(maxErrorRatePercent: number = 2.0, maxP99LatencyMs: number = 500) {
    this.maxErrorRatePercent = maxErrorRatePercent;
    this.maxP99LatencyMs = maxP99LatencyMs;
  }

  evaluateCanary(metrics: CanaryHealthMetrics, previousStableTag: string): RollbackDecision {
    if (metrics.errorRatePercent > this.maxErrorRatePercent) {
      return {
        shouldRollback: true,
        reason: `Error rate ${metrics.errorRatePercent}% exceeded threshold ${this.maxErrorRatePercent}%`,
        targetTag: previousStableTag
      };
    }

    if (metrics.p99LatencyMs > this.maxP99LatencyMs) {
      return {
        shouldRollback: true,
        reason: `P99 latency ${metrics.p99LatencyMs}ms exceeded threshold ${this.maxP99LatencyMs}ms`,
        targetTag: previousStableTag
      };
    }

    if (metrics.healthyReplicas <= 0) {
      return {
        shouldRollback: true,
        reason: 'Zero healthy replicas detected in canary deployment',
        targetTag: previousStableTag
      };
    }

    return {
      shouldRollback: false,
      targetTag: previousStableTag
    };
  }
}
