/**
 * Architecture Service: Automated Slow Query Diagnostic Logger
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-15]
 */

export interface QueryExecutionReport {
  query: string;
  durationMs: number;
  plan?: {
    nodeType: string;
    totalCost: number;
    hasSeqScan: boolean;
  };
}

export class SlowQueryDiagnosticLoggerService {
  private slowThresholdMs: number;

  constructor(slowThresholdMs: number = 200) {
    this.slowThresholdMs = slowThresholdMs;
  }

  public analyzeAndDiagnose(report: QueryExecutionReport): {
    isSlow: boolean;
    recommendation: string | null;
  } {
    if (report.durationMs < this.slowThresholdMs) {
      return { isSlow: false, recommendation: null };
    }

    if (report.plan && report.plan.hasSeqScan) {
      return {
        isSlow: true,
        recommendation: `Query took ${report.durationMs}ms with sequential scan detected. Add an index for filter columns in: "${report.query}"`
      };
    }

    return {
      isSlow: true,
      recommendation: `Query took ${report.durationMs}ms exceeding threshold of ${this.slowThresholdMs}ms.`
    };
  }
}
