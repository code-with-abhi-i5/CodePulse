import { ComplexityEstimate } from '../../types/ai';

export class TimeComplexityEstimator {
  estimateComplexity(code: string): ComplexityEstimate {
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

    let estimatedNotation: 'O(1)' | 'O(log N)' | 'O(N)' | 'O(N log N)' | 'O(N^2)' | 'O(2^N)' = 'O(1)';
    let reason = 'Constant time operations detected';

    if (hasRecursion && totalLoops > 0) {
      estimatedNotation = 'O(2^N)';
      reason = 'Exponential complexity detected from recursive branch calls and loops';
    } else if (totalLoops >= 2 || maxNestingDepth >= 3) {
      estimatedNotation = 'O(N^2)';
      reason = 'Nested loop iteration structures indicate quadratic runtime complexity';
    } else if (totalLoops === 1) {
      estimatedNotation = 'O(N)';
      reason = 'Linear traversal loops detected';
    } else if (code.includes('/ 2') || code.includes('>> 1')) {
      estimatedNotation = 'O(log N)';
      reason = 'Binary search halving patterns identified';
    }

    return {
      estimatedNotation,
      maxNestingDepth,
      hasRecursion,
      reason
    };
  }
}
