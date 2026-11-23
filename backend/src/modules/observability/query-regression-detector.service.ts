import { Injectable, Logger } from '@nestjs/common';
import { PlanRegressionAlert, QueryStatSample } from './query-regression-detector.types';

@Injectable()
export class QueryRegressionDetectorService {
  private readonly logger = new Logger(QueryRegressionDetectorService.name);

  private readonly baselines = new Map<string, number>();
  private readonly alerts: PlanRegressionAlert[] = [];

  public setBaseline(fingerprint: string, meanTimeMs: number): void {
    this.baselines.set(fingerprint, meanTimeMs);
  }

  public analyzeSample(sample: QueryStatSample): PlanRegressionAlert | null {
    const base = this.baselines.get(sample.fingerprint);
    if (!base) {
      this.baselines.set(sample.fingerprint, sample.meanExecTimeMs);
      return null;
    }

    const ratio = sample.meanExecTimeMs / base;
    if (ratio >= 2.0 && sample.meanExecTimeMs > 20) {
      const alert: PlanRegressionAlert = {
        queryId: sample.queryId,
        fingerprint: sample.fingerprint,
        baselineTimeMs: base,
        observedTimeMs: sample.meanExecTimeMs,
        regressionRatio: Math.round(ratio * 10) / 10,
        detectedAt: Date.now(),
      };
      this.alerts.push(alert);
      this.logger.warn(`[Query Regression] Execution time degraded by ${alert.regressionRatio}x on query ${sample.fingerprint} (${base}ms -> ${sample.meanExecTimeMs}ms)`);
      return alert;
    }

    return null;
  }

  public getAlerts(): PlanRegressionAlert[] {
    return [...this.alerts];
  }
}
