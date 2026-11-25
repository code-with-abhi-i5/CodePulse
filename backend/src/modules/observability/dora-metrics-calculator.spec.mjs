import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class DoraMetricsCalculatorService {
  calculate(deploymentsCount, periodDays, leadTimeMinutesArray, restoreTimeMinutesArray, failedDeploymentsCount) {
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

    let doraTier = 'low';
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

describe('DoraMetricsCalculatorService', () => {
  it('accurately computes DORA metrics and classifies organization tier', () => {
    const calc = new DoraMetricsCalculatorService();
    const metrics = calc.calculate(30, 30, [25, 35, 45], [15, 20], 1);
    assert.strictEqual(metrics.deploymentFrequencyPerDay, 1);
    assert.strictEqual(metrics.leadTimeForChangesMinutes, 35);
    assert.strictEqual(metrics.changeFailureRatePercent, 3.33);
    assert.strictEqual(metrics.doraTier, 'elite');
  });
});
