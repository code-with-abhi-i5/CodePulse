import { Injectable } from '@nestjs/common';
import { DoraMetrics } from '../../types/observability';

@Injectable()
export class DoraMetricsCalculatorService {
  calculate(
    deploymentsCount: number,
    periodDays: number,
    leadTimeMinutesArray: number[],
    restoreTimeMinutesArray: number[],
    failedDeploymentsCount: number
  ): DoraMetrics {
    const deploymentFrequencyPerDay = periodDays > 0 ? parseFloat((deploymentsCount / periodDays).toFixed(2)) : 0;
    const leadTimeForChangesMinutes =
      leadTimeMinutesArray.length > 0
        ? Math.round(leadTimeMinutesArray.reduce((acc, m) => acc + m, 0) / leadTimeMinutesArray.length)
        : 0;

    const meanTimeToRestoreMinutes =
      restoreTimeMinutesArray.length > 0
        ? Math.round(restoreTimeMinutesArray.reduce((acc, m) => acc + m, 0) / restoreTimeMinutesArray.length)
        : 0;

    const changeFailureRatePercent =
      deploymentsCount > 0
        ? parseFloat(((failedDeploymentsCount / deploymentsCount) * 100).toFixed(2))
        : 0;

    let doraTier: 'elite' | 'high' | 'medium' | 'low' = 'low';
    if (deploymentFrequencyPerDay >= 1 && leadTimeForChangesMinutes < 60 && changeFailureRatePercent < 5) {
      doraTier = 'elite';
    } else if (deploymentFrequencyPerDay >= 0.2 && leadTimeForChangesMinutes < 1440) {
      doraTier = 'high';
    } else if (deploymentFrequencyPerDay >= 0.05) {
      doraTier = 'medium';
    }

    return {
      deploymentFrequencyPerDay,
      leadTimeForChangesMinutes,
      meanTimeToRestoreMinutes,
      changeFailureRatePercent,
      doraTier
    };
  }
}
