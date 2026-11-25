/**
 * Architecture Service: Visual Code Coverage Overlay
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-53]
 */

export interface LineCoverage {
  lineNumber: number;
  hits: number;
  isCovered: boolean;
}

export class CodeCoverageOverlayService {
  private lineCoverage: Map<number, LineCoverage>;

  constructor() {
    this.lineCoverage = new Map();
  }

  public setCoverage(lines: { lineNumber: number; hits: number }[]): void {
    this.lineCoverage.clear();
    for (const l of lines) {
      this.lineCoverage.set(l.lineNumber, {
        lineNumber: l.lineNumber,
        hits: l.hits,
        isCovered: l.hits > 0
      });
    }
  }

  public getCoveragePercentage(): number {
    const total = this.lineCoverage.size;
    if (total === 0) return 100;
    const covered = Array.from(this.lineCoverage.values()).filter(l => l.isCovered).length;
    return Math.round((covered / total) * 100);
  }

  public getUncoveredLines(): number[] {
    return Array.from(this.lineCoverage.values())
      .filter(l => !l.isCovered)
      .map(l => l.lineNumber);
  }

  public getGutterClass(line: number): string {
    const cov = this.lineCoverage.get(line);
    if (!cov) return 'coverage-neutral';
    return cov.isCovered ? 'coverage-hit' : 'coverage-miss';
  }
}
