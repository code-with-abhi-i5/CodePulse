import { ChaosExperimentConfig, ChaosExecutionResult } from '../../types/sre';

export class ChaosFaultInjectionRunner {
  evaluateAndRun(
    config: ChaosExperimentConfig,
    currentHourUtc: number,
    currentErrorRatePercent: number
  ): ChaosExecutionResult {
    if (!config.allowedOffPeakHoursUtc.includes(currentHourUtc)) {
      return {
        experimentId: config.experimentId,
        executed: false,
        aborted: false,
        reason: `Current UTC hour ${currentHourUtc} is not within configured off-peak hours [${config.allowedOffPeakHoursUtc.join(',')}]`,
        simulatedDelayMs: 0
      };
    }

    if (currentErrorRatePercent > config.maxAllowedErrorRatePercent) {
      return {
        experimentId: config.experimentId,
        executed: false,
        aborted: true,
        reason: `Aborting chaos injection: system error rate ${currentErrorRatePercent}% exceeds safety threshold of ${config.maxAllowedErrorRatePercent}%`,
        simulatedDelayMs: 0
      };
    }

    const delay = config.faultType === 'latency' ? (config.magnitudeMs || 250) : 0;

    return {
      experimentId: config.experimentId,
      executed: true,
      aborted: false,
      simulatedDelayMs: delay
    };
  }
}
