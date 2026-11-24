import { Injectable, Logger } from '@nestjs/common';
import { ErrorBudgetTrackerService } from './error-budget-tracker.service';

export type AlertChannel = 'PAGE' | 'TICKET';

export interface BurnRateAlert {
  alertId: string;
  sloId: string;
  channel: AlertChannel;
  burnRate: number;
  longWindowHours: number;
  shortWindowMinutes: number;
  budgetConsumedPercent: number;
  message: string;
  timestamp: Date;
}

export interface BurnRateRule {
  channel: AlertChannel;
  burnRateThreshold: number;
  longWindowMs: number;
  shortWindowMs: number;
  budgetConsumedPercent: number;
}

@Injectable()
export class SloBurnRateService {
  private readonly logger = new Logger(SloBurnRateService.name);

  // Google SRE multi-window multi-burn-rate standard rules
  public static readonly SRE_RULES: BurnRateRule[] = [
    {
      channel: 'PAGE',
      burnRateThreshold: 14.4,
      longWindowMs: 60 * 60 * 1000, // 1h
      shortWindowMs: 5 * 60 * 1000, // 5m
      budgetConsumedPercent: 2,
    },
    {
      channel: 'PAGE',
      burnRateThreshold: 6.0,
      longWindowMs: 6 * 60 * 60 * 1000, // 6h
      shortWindowMs: 30 * 60 * 1000, // 30m
      budgetConsumedPercent: 5,
    },
    {
      channel: 'TICKET',
      burnRateThreshold: 3.0,
      longWindowMs: 24 * 60 * 60 * 1000, // 24h
      shortWindowMs: 2 * 60 * 60 * 1000, // 2h
      budgetConsumedPercent: 10,
    },
    {
      channel: 'TICKET',
      burnRateThreshold: 1.0,
      longWindowMs: 3 * 24 * 60 * 60 * 1000, // 3 days
      shortWindowMs: 6 * 60 * 60 * 1000, // 6h
      budgetConsumedPercent: 10,
    },
  ];

  constructor(private readonly tracker: ErrorBudgetTrackerService) {}

  /**
   * Evaluates all multi-window multi-burn-rate rules for an SLO.
   * Both long window AND short window must exceed burn rate threshold to fire (eliminates false positives).
   */
  public evaluateBurnRate(sloId: string, nowMs = Date.now()): BurnRateAlert[] {
    const status = this.tracker.getBudgetStatus(sloId, nowMs);
    const allowedErrorRate = status.allowedErrorBudgetPercent / 100; // e.g. 0.001 for 99.9%
    const activeAlerts: BurnRateAlert[] = [];

    for (const rule of SloBurnRateService.SRE_RULES) {
      const longRes = this.tracker.calculateWindowErrorRate(sloId, rule.longWindowMs, nowMs);
      const shortRes = this.tracker.calculateWindowErrorRate(sloId, rule.shortWindowMs, nowMs);

      if (longRes.total < 10 || shortRes.total < 5) {
        continue; // insufficient sample size in window
      }

      const longBurnRate = allowedErrorRate > 0 ? longRes.errorRate / allowedErrorRate : 0;
      const shortBurnRate = allowedErrorRate > 0 ? shortRes.errorRate / allowedErrorRate : 0;

      // Both long window AND short window must violate burn threshold
      if (longBurnRate >= rule.burnRateThreshold && shortBurnRate >= rule.burnRateThreshold) {
        const alert: BurnRateAlert = {
          alertId: `slo-burn-${rule.channel.toLowerCase()}-${sloId}-${Date.now()}`,
          sloId,
          channel: rule.channel,
          burnRate: Number(longBurnRate.toFixed(2)),
          longWindowHours: rule.longWindowMs / (60 * 60 * 1000),
          shortWindowMinutes: rule.shortWindowMs / (60 * 1000),
          budgetConsumedPercent: rule.budgetConsumedPercent,
          message: `🚨 [SLO ${rule.channel}]: Burn rate ${longBurnRate.toFixed(1)}x on SLO '${sloId}' consumes ${rule.budgetConsumedPercent}% error budget. (Long: ${rule.longWindowMs / (60 * 60 * 1000)}h, Short: ${rule.shortWindowMs / (60 * 1000)}m)`,
          timestamp: new Date(nowMs),
        };

        activeAlerts.push(alert);
        if (rule.channel === 'PAGE') {
          this.logger.error(alert.message);
        } else {
          this.logger.warn(alert.message);
        }
      }
    }

    return activeAlerts;
  }
}
