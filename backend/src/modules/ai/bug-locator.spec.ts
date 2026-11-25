import assert from 'node:assert/strict';
import test from 'node:test';

class BugLocatorService {
  calculateTarantulaScores(matrix) {
    const totalFailed = matrix.filter(c => !c.passed).length || 1;
    const totalPassed = matrix.filter(c => c.passed).length || 1;
    const lineStats = new Map();

    matrix.forEach(e => {
      let s = lineStats.get(e.line) || { failedCount: 0, passedCount: 0 };
      if (e.passed) s.passedCount++;
      else s.failedCount++;
      lineStats.set(e.line, s);
    });

    const res = [];
    for (const [line, stats] of lineStats.entries()) {
      const failRatio = stats.failedCount / totalFailed;
      const passRatio = stats.passedCount / totalPassed;
      const score = (failRatio + passRatio) > 0 ? failRatio / (failRatio + passRatio) : 0;
      res.push({ lineNumber: line, score: parseFloat(score.toFixed(3)), failedTestCount: stats.failedCount });
    }
    return res.sort((a, b) => b.score - a.score);
  }
}

test('BugLocatorService: ranks faulty code lines via Tarantula spectral localization formula', () => {
  const locator = new BugLocatorService();
  const matrix = [
    { line: 10, passed: false },
    { line: 10, passed: false },
    { line: 5, passed: true },
    { line: 10, passed: true }
  ];
  const rankings = locator.calculateTarantulaScores(matrix);
  assert.equal(rankings[0].lineNumber, 10);
  assert.ok(rankings[0].score > 0.5);
});
