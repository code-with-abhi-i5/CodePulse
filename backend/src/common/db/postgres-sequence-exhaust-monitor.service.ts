import { SequenceExhaustReport } from '../../types/db';

export class PostgresSequenceExhaustMonitorService {
  private readonly warningThresholdPercentage = 80.0;

  evaluateSequence(sequenceName: string, currentValue: number, maxValue: number = 2147483647): SequenceExhaustReport {
    const percent = Math.round((currentValue / maxValue) * 10000) / 100;
    const isNearing = percent >= this.warningThresholdPercentage;

    return {
      sequenceName,
      currentValue,
      maxValue,
      percentUsed: percent,
      isNearingExhaustion: isNearing
    };
  }
}
