import { AlgorithmicBreakdown } from '../../types/ai';

export class AlgorithmicBreakdownService {
  generateBreakdown(code: string, input: string, expected: string, actual: string): AlgorithmicBreakdown {
    let divergenceStep = 'General return value discrepancy.';
    const recommendations: string[] = [];

    if (expected.trim() === 'true' && actual.trim() === 'false') {
      divergenceStep = 'Early exit or boundary condition rejected a valid case.';
      recommendations.push('Review edge case conditions for zero, empty arrays, or single elements.');
    } else if (expected.trim() === 'false' && actual.trim() === 'true') {
      divergenceStep = 'Condition evaluated true without validating required sub-properties.';
      recommendations.push('Ensure complete invariant validation across all nested loops.');
    } else if (!isNaN(Number(expected)) && !isNaN(Number(actual))) {
      const diff = Number(expected) - Number(actual);
      if (Math.abs(diff) === 1) {
        divergenceStep = 'Potential off-by-one error (difference of ' + diff + ').';
        recommendations.push('Check inclusive vs exclusive loop bounds (e.g. <= vs <, or starting index 0 vs 1).');
      } else {
        divergenceStep = 'Numerical divergence of ' + diff + '.';
        recommendations.push('Verify state accumulation formula and initial accumulator values.');
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
