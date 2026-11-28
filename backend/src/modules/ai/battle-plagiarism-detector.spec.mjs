import test from 'node:test';
import assert from 'node:assert/strict';

class BattlePlagiarismDetectorService {
  compareSubmissions(codeA, codeB) {
    const tokensA = this.tokenizeAndNormalize(codeA);
    const tokensB = this.tokenizeAndNormalize(codeB);

    const setB = new Set(tokensB);
    let common = 0;
    for (const t of tokensA) {
      if (setB.has(t)) common++;
    }

    const similarity = Math.round((2 * common) / (tokensA.length + tokensB.length) * 100) / 100;
    return {
      similarityScore: similarity,
      isFlagged: similarity >= 0.85,
      commonNormalizedTokens: common
    };
  }

  tokenizeAndNormalize(code) {
    const kw = new Set(['let', 'const', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'class']);
    return code
      .replace(/[^a-zA-Z0-9_+*-]/g, ' ')
      .split(' ')
      .filter(t => t.length > 0)
      .map(t => kw.has(t) || ['+', '-', '*', '/'].includes(t) ? t : 'ID');
  }
}

test('BattlePlagiarismDetectorService - flags identical token structure across submissions', () => {
  const service = new BattlePlagiarismDetectorService();
  const sub1 = 'function solve(a, b) { return a + b; }';
  const sub2 = 'function compute(x, y) { return x + y; }';
  const result = service.compareSubmissions(sub1, sub2);

  assert.ok(result.similarityScore >= 0.6);
  assert.equal(typeof result.isFlagged, 'boolean');
});
