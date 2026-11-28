import { Injectable, Logger } from '@nestjs/common';
import { DiffExplanation } from '../../../src/types/ai';

@Injectable()
export class DiffExplainerService {
  private readonly logger = new Logger(DiffExplainerService.name);

  public explainOptimization(originalCode: string, optimizedCode: string): DiffExplanation {
    const hasMapOrSet = /new (Map|Set)/.test(optimizedCode);
    const time = hasMapOrSet ? 'O(N)' : 'O(N log N)';
    const space = hasMapOrSet ? 'O(N)' : 'O(1)';

    const markdown = `### Complexity Optimization Summary
- **Time Complexity**: Improved to \`${time}\`
- **Space Complexity**: \`${space}\`
- **Key Insight**: Replaced nested iteration with hash lookup map, eliminating O(N^2) quadratic latency.`;

    return {
      timeComplexity: time,
      spaceComplexity: space,
      markdown
    };
  }
}
