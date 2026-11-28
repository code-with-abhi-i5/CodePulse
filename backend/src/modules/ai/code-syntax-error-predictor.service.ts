import { SyntaxPredictionResult } from '../../types/ai';

export class CodeSyntaxErrorPredictorService {
  predictSyntaxErrors(snippet: string): SyntaxPredictionResult {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
    const closers: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

    for (let i = 0; i < snippet.length; i++) {
      const char = snippet[i];
      if (pairs[char]) {
        stack.push(char);
      } else if (closers[char]) {
        const expected = closers[char];
        if (stack.length > 0 && stack[stack.length - 1] === expected) {
          stack.pop();
        }
      }
    }

    const unclosed = stack.map(open => pairs[open]);
    const hasAnomaly = unclosed.length > 0;
    const suggestedCompletion = unclosed.reverse().join('');

    return {
      hasSyntaxAnomaly: hasAnomaly,
      unclosedDelimiters: unclosed,
      suggestedCompletion
    };
  }
}
