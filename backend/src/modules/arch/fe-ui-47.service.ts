/**
 * Architecture Service: Test Runner Output Visualizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-47]
 */

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  expected?: string;
  actual?: string;
  error?: string;
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  content: string;
}

export class TestRunnerDiffVisualizerService {
  private results: TestCaseResult[];

  constructor() {
    this.results = [];
  }

  public recordTest(res: TestCaseResult): void {
    this.results.push(res);
  }

  public computeSummary(): { total: number; passed: number; failed: number; durationMs: number; passRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, failed, durationMs, passRate };
  }

  public generateDiff(expected: string, actual: string): DiffLine[] {
    const expLines = expected.split('\n');
    const actLines = actual.split('\n');
    const diff: DiffLine[] = [];

    const max = Math.max(expLines.length, actLines.length);
    for (let i = 0; i < max; i++) {
      const e = expLines[i];
      const a = actLines[i];
      if (e === a) {
        if (e !== undefined) diff.push({ type: 'same', content: e });
      } else {
        if (e !== undefined) diff.push({ type: 'removed', content: '- ' + e });
        if (a !== undefined) diff.push({ type: 'added', content: '+ ' + a });
      }
    }
    return diff;
  }
}
