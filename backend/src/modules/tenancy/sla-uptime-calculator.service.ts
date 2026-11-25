import { SlaEvaluation } from '../../types/tenancy';

export class SlaUptimeCalculator {
  evaluateMonthlySla(tenantId: string, month: string, totalMinutesInMonth: number, downtimeMinutes: number): SlaEvaluation {
    if (totalMinutesInMonth <= 0) throw new Error('totalMinutesInMonth must be positive');
    const uptimeMinutes = Math.max(0, totalMinutesInMonth - downtimeMinutes);
    const uptimePercentage = Number(((uptimeMinutes / totalMinutesInMonth) * 100).toFixed(4));
    const slaMet = uptimePercentage >= 99.9;
    
    let penaltyCreditPercent = 0;
    if (uptimePercentage < 95.0) {
      penaltyCreditPercent = 50;
    } else if (uptimePercentage < 99.0) {
      penaltyCreditPercent = 25;
    } else if (uptimePercentage < 99.9) {
      penaltyCreditPercent = 10;
    }

    return {
      tenantId,
      month,
      uptimePercentage,
      slaMet,
      downtimeMinutes,
      penaltyCreditPercent
    };
  }
}
