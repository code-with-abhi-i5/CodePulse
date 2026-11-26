import { SloWindowMetric, SloBurnRateAlert } from '../../types/sre';

export class SloBurnRateCalculator {
  evaluateBurnRate(
    sloName: string,
    targetAvailabilityPercent: number,
    metric1h: SloWindowMetric,
    metric6h: SloWindowMetric
  ): SloBurnRateAlert {
    const allowedErrorBudgetRate = (100 - targetAvailabilityPercent) / 100;
    if (allowedErrorBudgetRate <= 0) {
      throw new Error('Invalid SLO target');
    }

    const errorRate1h = metric1h.totalRequests > 0 ? (metric1h.failedRequests / metric1h.totalRequests) : 0;
    const errorRate6h = metric6h.totalRequests > 0 ? (metric6h.failedRequests / metric6h.totalRequests) : 0;

    const burnRate1h = Math.round((errorRate1h / allowedErrorBudgetRate) * 100) / 100;
    const burnRate6h = Math.round((errorRate6h / allowedErrorBudgetRate) * 100) / 100;

    // Google SRE Multi-window multi-burn-rate standard
    // 14.4x over 1 hour burns 2% budget in 1 hour -> Page
    // 6.0x over 6 hours burns 5% budget in 6 hours -> Page
    // 3.0x burns budget over days -> Ticket
    let triggerPage = false;
    let triggerTicket = false;
    let severity: 'none' | 'ticket' | 'page' = 'none';
    let reason = 'SLO error budget burn rate is within safe operating margins';

    if (burnRate1h >= 14.4 || burnRate6h >= 6.0) {
      triggerPage = true;
      severity = 'page';
      reason = `Critical burn rate: 1h burn rate is ${burnRate1h}x (limit 14.4x), 6h burn rate is ${burnRate6h}x (limit 6x)`;
    } else if (burnRate1h >= 3.0 || burnRate6h >= 3.0) {
      triggerTicket = true;
      severity = 'ticket';
      reason = `Elevated burn rate: 1h burn rate is ${burnRate1h}x, 6h burn rate is ${burnRate6h}x`;
    }

    return {
      sloName,
      burnRate1h,
      burnRate6h,
      triggerPage,
      triggerTicket,
      severity,
      reason
    };
  }
}
