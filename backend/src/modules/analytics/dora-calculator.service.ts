import { Injectable, Logger } from '@nestjs/common';
import { DoraPerformanceTier } from './dora-metrics.service';

export interface DoraRawDataInput {
  deployments: Array<{
    deployedAt: Date | string;
    commitCreatedAt: Date | string;
    isFailedOrRollback: boolean;
  }>;
  incidents: Array<{
    startedAt: Date | string;
    recoveredAt?: Date | string;
  }>;
  windowDays: number;
}

export interface DoraTierBreakdown {
  deploymentFrequencyTier: DoraPerformanceTier;
  leadTimeTier: DoraPerformanceTier;
  mttrTier: DoraPerformanceTier;
  changeFailureRateTier: DoraPerformanceTier;
  overallCompositeTier: DoraPerformanceTier;
  percentileRanking: number; // e.g. 95th percentile
}

export interface DoraComputedMetrics {
  deploymentsPerDay: number;
  leadTimeHours: number;
  mttrHours: number;
  changeFailureRatePct: number;
  totalDeployments: number;
  failedDeployments: number;
  tiers: DoraTierBreakdown;
  recommendations: string[];
}

@Injectable()
export class DoraCalculatorService {
  private readonly logger = new Logger(DoraCalculatorService.name);

  /**
   * Computes DORA metrics and benchmarks them against industry standards.
   */
  public computeDoraMetrics(input: DoraRawDataInput): DoraComputedMetrics {
    const totalDeployments = input.deployments.length;
    const windowDays = Math.max(1, input.windowDays);

    // 1. Deployment Frequency
    const deploymentsPerDay = Number((totalDeployments / windowDays).toFixed(2));

    // 2. Lead Time for Changes (average hours from commit creation to deployment)
    let leadTimeHours = 0;
    if (totalDeployments > 0) {
      let totalLeadMs = 0;
      for (const d of input.deployments) {
        const commitMs = new Date(d.commitCreatedAt).getTime();
        const deployMs = new Date(d.deployedAt).getTime();
        totalLeadMs += Math.max(0, deployMs - commitMs);
      }
      leadTimeHours = Number((totalLeadMs / (totalDeployments * 3600000)).toFixed(2));
    }

    // 3. Change Failure Rate (%)
    const failedDeployments = input.deployments.filter((d) => d.isFailedOrRollback).length;
    const changeFailureRatePct = totalDeployments > 0
      ? Number(((failedDeployments / totalDeployments) * 100).toFixed(2))
      : 0;

    // 4. Mean Time to Recovery (MTTR) in hours
    let mttrHours = 0;
    const resolvedIncidents = input.incidents.filter((i) => !!i.recoveredAt);
    if (resolvedIncidents.length > 0) {
      let totalRecoveryMs = 0;
      for (const inc of resolvedIncidents) {
        const start = new Date(inc.startedAt).getTime();
        const end = new Date(inc.recoveredAt!).getTime();
        totalRecoveryMs += Math.max(0, end - start);
      }
      mttrHours = Number((totalRecoveryMs / (resolvedIncidents.length * 3600000)).toFixed(2));
    }

    // 5. Categorize individual tiers
    const dfTier = this.classifyDeploymentFrequency(deploymentsPerDay);
    const ltTier = this.classifyLeadTime(leadTimeHours);
    const mttrTier = this.classifyMttr(mttrHours);
    const cfrTier = this.classifyChangeFailureRate(changeFailureRatePct);

    // 6. Composite Tier Rating (Numeric Score average: Elite=4, High=3, Medium=2, Low=1)
    const tierScoreMap: Record<DoraPerformanceTier, number> = {
      Elite: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const avgScore = (
      tierScoreMap[dfTier] +
      tierScoreMap[ltTier] +
      tierScoreMap[mttrTier] +
      tierScoreMap[cfrTier]
    ) / 4;

    let overallCompositeTier: DoraPerformanceTier = 'Low';
    let percentileRanking = 25;

    if (avgScore >= 3.5) {
      overallCompositeTier = 'Elite';
      percentileRanking = 95;
    } else if (avgScore >= 2.75) {
      overallCompositeTier = 'High';
      percentileRanking = 75;
    } else if (avgScore >= 1.75) {
      overallCompositeTier = 'Medium';
      percentileRanking = 50;
    } else {
      overallCompositeTier = 'Low';
      percentileRanking = 20;
    }

    // 7. Actionable recommendations
    const recommendations = this.generateRecommendations(dfTier, ltTier, mttrTier, cfrTier);

    return {
      deploymentsPerDay,
      leadTimeHours,
      mttrHours,
      changeFailureRatePct,
      totalDeployments,
      failedDeployments,
      tiers: {
        deploymentFrequencyTier: dfTier,
        leadTimeTier: ltTier,
        mttrTier,
        changeFailureRateTier: cfrTier,
        overallCompositeTier,
        percentileRanking,
      },
      recommendations,
    };
  }

  public classifyDeploymentFrequency(perDay: number): DoraPerformanceTier {
    if (perDay >= 1.0) return 'Elite'; // On-demand (multiple deploys/day)
    if (perDay >= 0.14) return 'High'; // Between once per day and once per week
    if (perDay >= 0.03) return 'Medium'; // Between once per week and once per month
    return 'Low';
  }

  public classifyLeadTime(hours: number): DoraPerformanceTier {
    if (hours < 24) return 'Elite'; // Less than one day
    if (hours <= 168) return 'High'; // Between one day and one week
    if (hours <= 720) return 'Medium'; // Between one week and one month
    return 'Low';
  }

  public classifyMttr(hours: number): DoraPerformanceTier {
    if (hours < 1) return 'Elite'; // Less than one hour
    if (hours < 24) return 'High'; // Less than one day
    if (hours <= 168) return 'Medium'; // Less than one week
    return 'Low';
  }

  public classifyChangeFailureRate(pct: number): DoraPerformanceTier {
    if (pct <= 5) return 'Elite';
    if (pct <= 15) return 'High';
    if (pct <= 30) return 'Medium';
    return 'Low';
  }

  private generateRecommendations(
    df: DoraPerformanceTier,
    lt: DoraPerformanceTier,
    mttr: DoraPerformanceTier,
    cfr: DoraPerformanceTier,
  ): string[] {
    const tips: string[] = [];
    if (df === 'Low' || df === 'Medium') {
      tips.push('Break down PR sizes and adopt trunk-based development to accelerate deployment cadence.');
    }
    if (lt === 'Low' || lt === 'Medium') {
      tips.push('Streamline CI pipelines by caching container layers and parallelizing integration test matrices.');
    }
    if (mttr === 'Low' || mttr === 'Medium') {
      tips.push('Invest in automated canary rollbacks and eBPF observability alerts to slash recovery time.');
    }
    if (cfr === 'Low' || cfr === 'Medium') {
      tips.push('Introduce automated preview environments and rigorous contract tests to reduce change regressions.');
    }
    if (tips.length === 0) {
      tips.push('Outstanding performance! Maintain automated canary deployments and zero-trust verification.');
    }
    return tips;
  }
}
