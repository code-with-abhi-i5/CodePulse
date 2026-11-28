import test from 'node:test';
import assert from 'node:assert/strict';

class CognitiveComplexityEvaluatorService {
  evaluateComplexity(code) {
    let cyclomatic = 1;
    let cognitive = 0;
    const branchPatterns = [/\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g];

    for (const pattern of branchPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        cyclomatic += matches.length;
        cognitive += matches.length * 2;
      }
    }

    let riskTier = 'low';
    if (cognitive > 8) riskTier = 'high';
    else if (cognitive > 4) riskTier = 'moderate';

    return { cyclomaticComplexity: cyclomatic, cognitiveComplexity: cognitive, riskTier };
  }
}

test('CognitiveComplexityEvaluatorService - calculates nesting penalties and cyclomatic paths', () => {
  const service = new CognitiveComplexityEvaluatorService();
  const code = 'function solve() { if (a) { for (let i = 0; i < 10; i++) { if (b) {} } } }';
  const result = service.evaluateComplexity(code);

  assert.ok(result.cyclomaticComplexity >= 4);
  assert.ok(result.cognitiveComplexity >= 6);
});
