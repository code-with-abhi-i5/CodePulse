import { Injectable } from '@nestjs/common';
import { CodeSubmissionMetrics } from '../../types/esports';

@Injectable()
export class DynamicTieBreakerService {
  breakTie(subA: CodeSubmissionMetrics, subB: CodeSubmissionMetrics): { winnerId: string; reason: string } {
    // Priority 1: Tests Passed
    if (subA.testsPassed !== subB.testsPassed) {
      return subA.testsPassed > subB.testsPassed
        ? { winnerId: subA.userId, reason: 'higher_tests_passed' }
        : { winnerId: subB.userId, reason: 'higher_tests_passed' };
    }

    // Priority 2: Cyclomatic Complexity (Lower is cleaner)
    if (subA.cyclomaticComplexity !== subB.cyclomaticComplexity) {
      return subA.cyclomaticComplexity < subB.cyclomaticComplexity
        ? { winnerId: subA.userId, reason: 'lower_cyclomatic_complexity' }
        : { winnerId: subB.userId, reason: 'lower_cyclomatic_complexity' };
    }

    // Priority 3: Runtime Latency (Lower is faster)
    if (subA.runtimeMs !== subB.runtimeMs) {
      return subA.runtimeMs < subB.runtimeMs
        ? { winnerId: subA.userId, reason: 'faster_runtime' }
        : { winnerId: subB.userId, reason: 'faster_runtime' };
    }

    // Priority 4: Memory Footprint
    return subA.memoryKb <= subB.memoryKb
      ? { winnerId: subA.userId, reason: 'lower_memory_footprint' }
      : { winnerId: subB.userId, reason: 'lower_memory_footprint' };
  }
}
