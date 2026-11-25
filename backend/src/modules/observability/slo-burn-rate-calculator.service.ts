import { Injectable } from '@nestjs/common';
import { SloConfig, BurnRateAlert } from '../../types/observability';

@Injectable()
export class SloBurnRateCalculatorService {
  calculateBurnRate(config: SloConfig, totalRequests: number, errorRequests: number): BurnRateAlert {
    if (totalRequests === 0) {
      return {
        serviceName: config.serviceName,
        sliName: config.sliName,
        burnRate: 0,
        budgetConsumedPercent: 0,
        timeToExhaustionHours: Infinity,
        severity: 'normal',
        triggered: false
      };
    }

    const actualErrorRate = errorRequests / totalRequests;
    const allowedErrorRate = 1 - config.sloTarget;
    const burnRate = allowedErrorRate > 0 ? actualErrorRate / allowedErrorRate : 0;
    const budgetConsumedPercent = parseFloat(((burnRate * (config.windowMinutes / 60)) / 720 * 100).toFixed(2));
    const timeToExhaustionHours = burnRate > 0 ? parseFloat((720 / burnRate).toFixed(1)) : Infinity;

    let severity: 'critical' | 'warning' | 'normal' = 'normal';
    let triggered = false;

    if (burnRate >= 14.4) {
      severity = 'critical';
      triggered = true;
    } else if (burnRate >= 6.0) {
      severity = 'warning';
      triggered = true;
    }

    return {
      serviceName: config.serviceName,
      sliName: config.sliName,
      burnRate: parseFloat(burnRate.toFixed(2)),
      budgetConsumedPercent,
      timeToExhaustionHours,
      severity,
      triggered
    };
  }
}
