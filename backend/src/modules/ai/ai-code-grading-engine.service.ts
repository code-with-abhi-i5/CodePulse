import { RubricScore } from '../../types/ai';

export class AiCodeGradingEngine {
  gradeSubmission(
    testPassRatio: number,
    cyclomaticComplexity: number,
    hasLintWarnings: boolean,
    executionTimeMs: number
  ): RubricScore {
    const correctness = Math.round(testPassRatio * 40); // Max 40
    const readability = Math.max(0, Math.round((1 - Math.min(cyclomaticComplexity, 20) / 20) * 25)); // Max 25
    const idiomaticQuality = hasLintWarnings ? 15 : 20; // Max 20
    const performance = executionTimeMs < 100 ? 15 : (executionTimeMs < 500 ? 10 : 5); // Max 15

    const compositeScore = correctness + readability + idiomaticQuality + performance;
    const feedback: string[] = [];

    if (testPassRatio < 1.0) feedback.push('Failing test cases detected');
    if (cyclomaticComplexity > 10) feedback.push('High cyclomatic complexity: consider breaking into helper functions');
    if (hasLintWarnings) feedback.push('Adhere to project lint conventions');

    return {
      correctness,
      readability,
      idiomaticQuality,
      performance,
      compositeScore,
      feedback
    };
  }
}
