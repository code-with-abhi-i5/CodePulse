/**
 * Architecture Service: CI/CD Flaky Test Detector and Quarantiner
 * Subsystem: Advanced DevOps & Infrastructure Automation [DEVOPS-INFRA-09]
 */

export interface TestRunHistory {
  testId: string;
  totalRuns: number;
  retryPassCount: number;
  failCount: number;
  isQuarantined: boolean;
}

export class FlakyTestQuarantinerService {
  private history: Map<string, TestRunHistory>;
  private maxFlakeRate: number;
  private minRunsToEvaluate: number;

  constructor(maxFlakeRate: number = 0.15, minRunsToEvaluate: number = 5) {
    this.history = new Map();
    this.maxFlakeRate = maxFlakeRate;
    this.minRunsToEvaluate = minRunsToEvaluate;
  }

  public recordRun(testId: string, passedFirstTry: boolean, passedOnRetry: boolean): TestRunHistory {
    let rec = this.history.get(testId);
    if (!rec) {
      rec = {
        testId,
        totalRuns: 0,
        retryPassCount: 0,
        failCount: 0,
        isQuarantined: false
      };
      this.history.set(testId, rec);
    }

    rec.totalRuns++;
    if (!passedFirstTry) {
      if (passedOnRetry) {
        rec.retryPassCount++;
      } else {
        rec.failCount++;
      }
    }

    if (rec.totalRuns >= this.minRunsToEvaluate) {
      const flakeRate = rec.retryPassCount / rec.totalRuns;
      if (flakeRate >= this.maxFlakeRate) {
        rec.isQuarantined = true;
      }
    }

    return rec;
  }

  public getQuarantinedTests(): string[] {
    const list: string[] = [];
    for (const [id, rec] of this.history.entries()) {
      if (rec.isQuarantined) list.push(id);
    }
    return list;
  }

  public unquarantine(testId: string): boolean {
    const rec = this.history.get(testId);
    if (rec && rec.isQuarantined) {
      rec.isQuarantined = false;
      rec.retryPassCount = 0;
      return true;
    }
    return false;
  }
}
