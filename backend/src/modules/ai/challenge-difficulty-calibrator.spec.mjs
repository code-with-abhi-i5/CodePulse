import test from 'node:test';
import assert from 'node:assert/strict';

class ChallengeDifficultyCalibratorService {
  calibrateDifficulty(description, starterCode, tags) {
    let difficultyScore = 3;
    const factors = [];

    if (tags.includes('dp') || tags.includes('dynamic-programming')) {
      difficultyScore += 3;
      factors.push('Dynamic programming recurrence complexity');
    }

    difficultyScore = Math.min(Math.max(difficultyScore, 1), 10);
    let tier = difficultyScore >= 6 ? 'hard' : 'easy';
    let predictedPassRate = difficultyScore >= 6 ? 42 : 80;

    return {
      predictedDifficulty: difficultyScore,
      difficultyTier: tier,
      predictedPassRate,
      complexityFactors: factors
    };
  }
}

test('ChallengeDifficultyCalibratorService - computes difficulty tier and pass rate based on tags', () => {
  const service = new ChallengeDifficultyCalibratorService();
  const dpProblem = service.calibrateDifficulty('Solve knapsack', '', ['dp', 'optimization']);
  assert.ok(dpProblem.predictedDifficulty >= 6);
  assert.equal(dpProblem.difficultyTier, 'hard');
  assert.ok(dpProblem.predictedPassRate <= 50);

  const easyProblem = service.calibrateDifficulty('Reverse a string', '', ['string', 'basic']);
  assert.ok(easyProblem.predictedDifficulty <= 4);
});
