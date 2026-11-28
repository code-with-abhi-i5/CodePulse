import { PlagiarismComparison } from '../../types/ai';

export class BattlePlagiarismDetectorService {
  compareSubmissions(codeA: string, codeB: string): PlagiarismComparison {
    const tokensA = this.tokenizeAndNormalize(codeA);
    const tokensB = this.tokenizeAndNormalize(codeB);

    if (tokensA.length === 0 || tokensB.length === 0) {
      return {
        similarityScore: 0,
        isFlagged: false,
        commonNormalizedTokens: 0,
        verdict: 'unique'
      };
    }

    const setB = new Set(tokensB);
    let common = 0;
    for (const t of tokensA) {
      if (setB.has(t)) common++;
    }

    const similarity = Math.round((2 * common) / (tokensA.length + tokensB.length) * 100) / 100;
    const isFlagged = similarity >= 0.85;

    return {
      similarityScore: similarity,
      isFlagged,
      commonNormalizedTokens: common,
      verdict: similarity >= 0.85 ? 'plagiarized' : similarity >= 0.65 ? 'suspicious' : 'unique'
    };
  }

  private tokenizeAndNormalize(code: string): string[] {
    const kw = new Set(['let', 'const', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'class']);
    return code
      .replace(/[^a-zA-Z0-9_+*-]/g, ' ')
      .split(' ')
      .filter(t => t.length > 0)
      .map(t => kw.has(t) || ['+', '-', '*', '/'].includes(t) ? t : 'ID');
  }
}
