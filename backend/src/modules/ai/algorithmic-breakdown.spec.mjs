import test from 'node:test';
import assert from 'node:assert/strict';

class AlgorithmicBreakdownService {
  generateBreakdown(code, input, expected, actual) {
    let divergenceStep = 'General return value discrepancy.';
    const recommendations = [];

    if (!isNaN(Number(expected)) && !isNaN(Number(actual))) {
      const diff = Number(expected) - Number(actual);
      if (Math.abs(diff) === 1) {
        divergenceStep = 'Potential off-by-one error (difference of ' + diff + ').';
        recommendations.push('Check inclusive vs exclusive loop bounds.');
      }
    }

    return {
      problemSummary: 'Execution diverged from expected specification on provided input.',
      divergenceStep,
      failedTestAnalysis: { input, expected, actual },
      recommendations
    };
  }
}

test('AlgorithmicBreakdownService - identifies off-by-one errors and provides diagnostics', () => {
  const service = new AlgorithmicBreakdownService();
  const breakdown = service.generateBreakdown('function sum() {}', '[1, 2, 3]', '6', '5');

  assert.ok(breakdown.divergenceStep.includes('off-by-one'));
  assert.equal(breakdown.failedTestAnalysis.expected, '6');
  assert.equal(breakdown.failedTestAnalysis.actual, '5');
  assert.ok(breakdown.recommendations.length > 0);
});
