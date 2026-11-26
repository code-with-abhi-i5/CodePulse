import test from 'node:test';
import assert from 'node:assert/strict';

class AiCodeGradingEngine {
  gradeSubmission(testPassRatio, cyclomaticComplexity, hasLintWarnings, executionTimeMs) {
    const correctness = Math.round(testPassRatio * 40);
    const readability = Math.max(0, Math.round((1 - Math.min(cyclomaticComplexity, 20) / 20) * 25));
    const idiomaticQuality = hasLintWarnings ? 15 : 20;
    const performance = executionTimeMs < 100 ? 15 : (executionTimeMs < 500 ? 10 : 5);

    const compositeScore = correctness + readability + idiomaticQuality + performance;
    const feedback = [];

    if (testPassRatio < 1.0) feedback.push('Failing test cases detected');
    if (cyclomaticComplexity > 10) feedback.push('High cyclomatic complexity');
    if (hasLintWarnings) feedback.push('Lint warnings present');

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

test('AiCodeGradingEngine - computes weighted rubric score across dimensions', () => {
  const engine = new AiCodeGradingEngine();
  const perfect = engine.gradeSubmission(1.0, 3, false, 50);
  assert.strictEqual(perfect.correctness, 40);
  assert.strictEqual(perfect.compositeScore, 96);
  assert.strictEqual(perfect.feedback.length, 0);

  const flawed = engine.gradeSubmission(0.5, 15, true, 800);
  assert.strictEqual(flawed.correctness, 20);
  assert.ok(flawed.compositeScore < 60);
  assert.ok(flawed.feedback.length >= 2);
});
