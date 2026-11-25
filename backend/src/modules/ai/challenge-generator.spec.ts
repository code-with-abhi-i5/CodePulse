import assert from 'node:assert/strict';
import test from 'node:test';

class ChallengeGeneratorService {
  synthesizeChallenge(topic, difficulty) {
    return {
      title: `Optimized ${topic} Arena`,
      difficulty,
      testCases: [
        { input: '[1, 2, 3]', output: '6' },
        { input: '[]', output: '0' },
        { input: '[-5, 5]', output: '0' }
      ]
    };
  }

  validateGeneratedTests(challenge) {
    return challenge.testCases.length >= 3 && challenge.testCases.some(tc => tc.input === '[]');
  }
}

test('ChallengeGeneratorService: synthesizes algorithmic battle challenges with edge assertions', () => {
  const generator = new ChallengeGeneratorService();
  const challenge = generator.synthesizeChallenge('Dynamic Programming', 'HARD');

  assert.equal(challenge.difficulty, 'HARD');
  assert.equal(generator.validateGeneratedTests(challenge), true);
});
