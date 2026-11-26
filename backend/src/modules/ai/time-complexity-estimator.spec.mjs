import test from 'node:test';
import assert from 'node:assert/strict';

class TimeComplexityEstimator {
  estimateComplexity(code) {
    const forMatches = (code.match(/for\s*\(/g) || []).length;
    const whileMatches = (code.match(/while\s*\(/g) || []).length;
    const totalLoops = forMatches + whileMatches;
    const funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
    const hasRecursion = Boolean(funcMatch && code.slice(funcMatch.index + funcMatch[0].length).includes(funcMatch[1] + '('));

    let maxNestingDepth = 0;
    let currentDepth = 0;
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        if (currentDepth > maxNestingDepth) maxNestingDepth = currentDepth;
      } else if (char === '}') {
        if (currentDepth > 0) currentDepth--;
      }
    }

    let estimatedNotation = 'O(1)';
    let reason = 'Constant time operations detected';

    if (hasRecursion && totalLoops > 0) {
      estimatedNotation = 'O(2^N)';
      reason = 'Exponential complexity detected';
    } else if (totalLoops >= 2 || maxNestingDepth >= 3) {
      estimatedNotation = 'O(N^2)';
      reason = 'Nested loop iteration structures indicate quadratic runtime';
    } else if (totalLoops === 1) {
      estimatedNotation = 'O(N)';
      reason = 'Linear traversal loops detected';
    }

    return {
      estimatedNotation,
      maxNestingDepth,
      hasRecursion,
      reason
    };
  }
}

test('TimeComplexityEstimator - estimates Big-O algorithmic complexity', () => {
  const estimator = new TimeComplexityEstimator();

  const linear = estimator.estimateComplexity('function run(arr) { for (let i = 0; i < arr.length; i++) { sum += arr[i]; } }');
  assert.strictEqual(linear.estimatedNotation, 'O(N)');

  const quadratic = estimator.estimateComplexity('function sort(arr) { for (let i = 0; i < arr.length; i++) { for (let j = 0; j < arr.length; j++) {} } }');
  assert.strictEqual(quadratic.estimatedNotation, 'O(N^2)');
});
