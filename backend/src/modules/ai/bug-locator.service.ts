import { Injectable, Logger } from '@nestjs/common';
import { SuspiciousLine } from '../../../src/types/ai';

@Injectable()
export class BugLocatorService {
  private readonly logger = new Logger(BugLocatorService.name);

  public calculateTarantulaScores(coverageMatrix: Array<{ line: number; passed: boolean }>): SuspiciousLine[] {
    const totalFailed = coverageMatrix.filter(c => !c.passed).length || 1;
    const totalPassed = coverageMatrix.filter(c => c.passed).length || 1;

    const lineStats: Map<number, { failedCount: number; passedCount: number }> = new Map();

    coverageMatrix.forEach(entry => {
      let stats = lineStats.get(entry.line);
      if (!stats) {
        stats = { failedCount: 0, passedCount: 0 };
        lineStats.set(entry.line, stats);
      }
      if (entry.passed) stats.passedCount++;
      else stats.failedCount++;
    });

    const results: SuspiciousLine[] = [];
    for (const [line, stats] of lineStats.entries()) {
      const failRatio = stats.failedCount / totalFailed;
      const passRatio = stats.passedCount / totalPassed;
      const score = (failRatio + passRatio) > 0 ? failRatio / (failRatio + passRatio) : 0;

      results.push({
        lineNumber: line,
        score: parseFloat(score.toFixed(3)),
        failedTestCount: stats.failedCount
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
