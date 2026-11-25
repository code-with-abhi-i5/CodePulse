/**
 * Architecture Service: Cloud Cost Anomaly Alerting Script
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-20]
 */

export interface HourlySpendRecord {
  hour: number;
  computeCostUsd: number;
  egressCostUsd: number;
  totalCostUsd: number;
}

export interface CostAnomalyAlert {
  isAnomaly: boolean;
  reason?: string;
  currentSpend: number;
  baselineSpend: number;
  multiplier: number;
}

export class CloudCostAnomalyAlertService {
  private history: HourlySpendRecord[];
  private anomalyMultiplierThreshold: number;
  private hardCapUsdPerHour: number;

  constructor(anomalyMultiplierThreshold: number = 1.5, hardCapUsdPerHour: number = 200) {
    this.history = [];
    this.anomalyMultiplierThreshold = anomalyMultiplierThreshold;
    this.hardCapUsdPerHour = hardCapUsdPerHour;
  }

  public recordHour(computeCostUsd: number, egressCostUsd: number): CostAnomalyAlert {
    const totalCostUsd = computeCostUsd + egressCostUsd;
    const currentRecord: HourlySpendRecord = {
      hour: Date.now(),
      computeCostUsd,
      egressCostUsd,
      totalCostUsd
    };

    if (totalCostUsd >= this.hardCapUsdPerHour) {
      this.history.push(currentRecord);
      return {
        isAnomaly: true,
        reason: 'Hard cap exceeded: $' + totalCostUsd.toFixed(2) + ' >= $' + this.hardCapUsdPerHour,
        currentSpend: totalCostUsd,
        baselineSpend: this.calculateBaseline(),
        multiplier: totalCostUsd / (this.calculateBaseline() || 1)
      };
    }

    const baseline = this.calculateBaseline();
    if (this.history.length >= 3 && baseline > 0) {
      const mult = totalCostUsd / baseline;
      if (mult >= this.anomalyMultiplierThreshold) {
        this.history.push(currentRecord);
        return {
          isAnomaly: true,
          reason: 'Hourly cost spike: ' + mult.toFixed(2) + 'x of baseline ($' + baseline.toFixed(2) + ')',
          currentSpend: totalCostUsd,
          baselineSpend: baseline,
          multiplier: mult
        };
      }
    }

    this.history.push(currentRecord);
    return {
      isAnomaly: false,
      currentSpend: totalCostUsd,
      baselineSpend: baseline,
      multiplier: 1.0
    };
  }

  private calculateBaseline(): number {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, r) => acc + r.totalCostUsd, 0);
    return sum / this.history.length;
  }
}
