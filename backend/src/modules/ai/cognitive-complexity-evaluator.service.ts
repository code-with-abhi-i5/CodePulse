import { CognitiveComplexityResult } from '../../types/ai';

export class CognitiveComplexityEvaluatorService {
  evaluateComplexity(code: string): CognitiveComplexityResult {
    let cyclomatic = 1;
    let cognitive = 0;

    const branchPatterns = [/\bif\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bcase\s+[^:]+:/g, /\bcatch\s*\(/g, /\?\s*[^:]+:/g];

    for (const pattern of branchPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        cyclomatic += matches.length;
        cognitive += matches.length * 1.5;
      }
    }

    const cogRound = Math.round(cognitive);
    let riskTier: 'low' | 'moderate' | 'high' | 'very_high' = 'low';

    if (cogRound > 25) riskTier = 'very_high';
    else if (cogRound > 15) riskTier = 'high';
    else if (cogRound > 8) riskTier = 'moderate';

    return {
      cyclomaticComplexity: cyclomatic,
      cognitiveComplexity: cogRound,
      riskTier
    };
  }
}
