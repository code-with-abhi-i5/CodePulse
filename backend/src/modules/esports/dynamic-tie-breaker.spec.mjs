import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class DynamicTieBreakerService {
  breakTie(subA, subB) {
    if (subA.testsPassed !== subB.testsPassed) {
      return subA.testsPassed > subB.testsPassed
        ? { winnerId: subA.userId, reason: 'higher_tests_passed' }
        : { winnerId: subB.userId, reason: 'higher_tests_passed' };
    }
    if (subA.cyclomaticComplexity !== subB.cyclomaticComplexity) {
      return subA.cyclomaticComplexity < subB.cyclomaticComplexity
        ? { winnerId: subA.userId, reason: 'lower_cyclomatic_complexity' }
        : { winnerId: subB.userId, reason: 'lower_cyclomatic_complexity' };
    }
    if (subA.runtimeMs !== subB.runtimeMs) {
      return subA.runtimeMs < subB.runtimeMs
        ? { winnerId: subA.userId, reason: 'faster_runtime' }
        : { winnerId: subB.userId, reason: 'faster_runtime' };
    }
    return subA.memoryKb <= subB.memoryKb
      ? { winnerId: subA.userId, reason: 'lower_memory_footprint' }
      : { winnerId: subB.userId, reason: 'lower_memory_footprint' };
  }
}

describe('DynamicTieBreakerService', () => {
  it('breaks ties evaluating cyclomatic complexity when test passes are equal', () => {
    const tieBreaker = new DynamicTieBreakerService();
    const result = tieBreaker.breakTie(
      { userId: 'alice', testsPassed: 10, totalTests: 10, cyclomaticComplexity: 3, runtimeMs: 45, memoryKb: 2048 },
      { userId: 'bob', testsPassed: 10, totalTests: 10, cyclomaticComplexity: 7, runtimeMs: 45, memoryKb: 2048 }
    );

    assert.strictEqual(result.winnerId, 'alice');
    assert.strictEqual(result.reason, 'lower_cyclomatic_complexity');
  });
});
