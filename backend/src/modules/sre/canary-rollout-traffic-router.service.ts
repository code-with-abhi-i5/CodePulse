import { CanaryMetrics, CanaryRoutingDecision } from '../../types/sre';

export class CanaryRolloutTrafficRouter {
  private currentWeightPercent: number = 5;
  private readonly maxAllowedErrorDeltaPercent: number = 0.5;

  evaluateNextStep(
    baseline: CanaryMetrics,
    canary: CanaryMetrics
  ): CanaryRoutingDecision {
    const baselineErrorRate = baseline.requestCount > 0 ? (baseline.errorCount / baseline.requestCount) * 100 : 0;
    const canaryErrorRate = canary.requestCount > 0 ? (canary.errorCount / canary.requestCount) * 100 : 0;

    if (canaryErrorRate - baselineErrorRate > this.maxAllowedErrorDeltaPercent) {
      this.currentWeightPercent = 0;
      return {
        trafficWeightPercent: 0,
        action: 'rollback',
        canaryErrorRate: Math.round(canaryErrorRate * 100) / 100,
        baselineErrorRate: Math.round(baselineErrorRate * 100) / 100,
        reason: `Rollback triggered: Canary error rate (${canaryErrorRate.toFixed(2)}%) exceeds baseline (${baselineErrorRate.toFixed(2)}%) by more than ${this.maxAllowedErrorDeltaPercent}%`
      };
    }

    let nextWeight = this.currentWeightPercent;
    if (this.currentWeightPercent < 100) {
      nextWeight = Math.min(100, this.currentWeightPercent + 20);
      this.currentWeightPercent = nextWeight;
    }

    return {
      trafficWeightPercent: nextWeight,
      action: 'advance',
      canaryErrorRate: Math.round(canaryErrorRate * 100) / 100,
      baselineErrorRate: Math.round(baselineErrorRate * 100) / 100,
      reason: `Canary healthy: advanced traffic weight to ${nextWeight}%`
    };
  }

  getCurrentWeight(): number {
    return this.currentWeightPercent;
  }

  reset(): void {
    this.currentWeightPercent = 5;
  }
}
