import { Injectable, Logger } from '@nestjs/common';
import { AstHintNode } from '../../../src/types/ai';

@Injectable()
export class AstSemanticHintService {
  private readonly logger = new Logger(AstSemanticHintService.name);

  public generateHintTree(code: string, failureDetails: { expected: string; actual: string }): AstHintNode[] {
    const hints: AstHintNode[] = [];

    // Progressive disclosure: Level 1 conceptual guidance
    hints.push({
      level: 1,
      category: 'ALGORITHM',
      guidance: 'Consider the time boundary condition when array length is 0 or 1.'
    });

    // Level 2 targeted hint
    if (!code.includes('return') || failureDetails.actual === 'undefined') {
      hints.push({
        level: 2,
        category: 'SYNTAX',
        guidance: 'Ensure your recursive base case explicitly returns the computed accumulator.'
      });
    }

    // Level 3 structural nudge without leaking direct solution
    hints.push({
      level: 3,
      category: 'EDGE_CASE',
      guidance: 'Review line 14 where loop invariant might terminate before the final element.'
    });

    return hints;
  }
}
