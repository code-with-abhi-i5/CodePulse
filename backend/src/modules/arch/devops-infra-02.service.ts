/**
 * Architecture Service: Automated Canary Deployment Rollback Detector
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-02]
 */

export interface DeploymentMetrics {
  totalRequests: number;
  errorRequests: number;
  p99LatencyMs: number;
}

export interface CanaryDecision {
  shouldRollback: boolean;
  reason?: string;
  canaryErrorRate: number;
  stableErrorRate: number;
}

export class CanaryRollbackDetectorService {
  private maxErrorRateDiff: number;
  private maxLatencyMultiplier: number;

  constructor(maxErrorRateDiff: number = 0.02, maxLatencyMultiplier: number = 2.0) {
    this.maxErrorRateDiff = maxErrorRateDiff;
    this.maxLatencyMultiplier = maxLatencyMultiplier;
  }

  public evaluateCanary(stable: DeploymentMetrics, canary: DeploymentMetrics): CanaryDecision {
    const stableErrorRate = stable.totalRequests > 0 ? stable.errorRequests / stable.totalRequests : 0;
    const canaryErrorRate = canary.totalRequests > 0 ? canary.errorRequests / canary.totalRequests : 0;

    if (canaryErrorRate - stableErrorRate > this.maxErrorRateDiff) {
      return {
        shouldRollback: true,
        reason: 'Error rate spike: canary=' + (canaryErrorRate * 100).toFixed(2) + '%, stable=' + (stableErrorRate * 100).toFixed(2) + '%',
        canaryErrorRate,
        stableErrorRate
      };
    }

    if (stable.p99LatencyMs > 0 && canary.p99LatencyMs > stable.p99LatencyMs * this.maxLatencyMultiplier) {
      return {
        shouldRollback: true,
        reason: 'p99 latency regression: canary=' + canary.p99LatencyMs + 'ms vs stable=' + stable.p99LatencyMs + 'ms',
        canaryErrorRate,
        stableErrorRate
      };
    }

    return {
      shouldRollback: false,
      canaryErrorRate,
      stableErrorRate
    };
  }
}
