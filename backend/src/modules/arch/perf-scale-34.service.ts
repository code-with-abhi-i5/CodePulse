/**
 * Architecture Service: Database Query Plan Regression Detector
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-34]
 */

export interface QueryBaseline {
  fingerprint: string;
  baselineCost: number;
  lastUpdated: number;
}

export interface RegressionAlert {
  fingerprint: string;
  baselineCost: number;
  newCost: number;
  ratio: number;
  timestamp: number;
  acknowledged: boolean;
}

export class QueryPlanRegressionDetectorService {
  private baselines: Map<string, QueryBaseline>;
  private regressions: Map<string, RegressionAlert>;
  private thresholdRatio: number;

  constructor(thresholdRatio: number = 2.0) {
    this.baselines = new Map();
    this.regressions = new Map();
    this.thresholdRatio = thresholdRatio;
  }

  public recordBaseline(fingerprint: string, cost: number): void {
    this.baselines.set(fingerprint, {
      fingerprint,
      baselineCost: cost,
      lastUpdated: Date.now()
    });
  }

  public evaluateQuery(fingerprint: string, currentCost: number): { isRegression: boolean; alert?: RegressionAlert } {
    const base = this.baselines.get(fingerprint);
    if (!base) {
      this.recordBaseline(fingerprint, currentCost);
      return { isRegression: false };
    }

    const ratio = currentCost / (base.baselineCost || 1);
    if (ratio >= this.thresholdRatio) {
      const alert: RegressionAlert = {
        fingerprint,
        baselineCost: base.baselineCost,
        newCost: currentCost,
        ratio,
        timestamp: Date.now(),
        acknowledged: false
      };
      this.regressions.set(fingerprint, alert);
      return { isRegression: true, alert };
    }

    return { isRegression: false };
  }

  public getRegressions(): RegressionAlert[] {
    return Array.from(this.regressions.values());
  }

  public acknowledge(fingerprint: string): boolean {
    const alert = this.regressions.get(fingerprint);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  public updateBaselineAfterMigration(fingerprint: string, acceptedCost: number): void {
    this.recordBaseline(fingerprint, acceptedCost);
    this.regressions.delete(fingerprint);
  }
}
