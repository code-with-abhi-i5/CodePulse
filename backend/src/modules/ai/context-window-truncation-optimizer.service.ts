import { TruncatedContext } from '../../types/ai';

export class ContextWindowTruncationOptimizerService {
  optimizeContext(fullCode: string, maxTokensBudget: number): TruncatedContext {
    const lines = fullCode.split('\n');
    const priorityLines: string[] = [];
    const omittedSections: string[] = [];

    // Prioritize imports and function signatures over large internal bodies
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ') || trimmed.startsWith('function ') || trimmed.startsWith('class ')) {
        priorityLines.push(line);
      } else if (priorityLines.length * 4 < maxTokensBudget) {
        priorityLines.push(line);
      } else {
        if (!omittedSections.includes('internal implementation details')) {
          omittedSections.push('internal implementation details');
        }
      }
    }

    return {
      optimizedPrompt: priorityLines.join('\n'),
      totalTokensEstimate: Math.round(priorityLines.join('\n').length / 4),
      omittedSections
    };
  }
}
