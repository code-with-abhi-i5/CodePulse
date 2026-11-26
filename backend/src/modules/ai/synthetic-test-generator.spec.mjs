import test from 'node:test';
import assert from 'node:assert/strict';

class SyntheticTestGenerator {
  generateDpTestCases(problemType) {
    return [
      { input: '[]', expectedOutput: '0', category: 'boundary' },
      { input: '[0]', expectedOutput: '0', category: 'boundary' },
      { input: '[1, 2, 3, 1]', expectedOutput: '4', category: 'adversarial' },
      { input: '1,1,1', expectedOutput: '3', category: 'performance' }
    ];
  }
}

test('SyntheticTestGenerator - synthesizes adversarial and boundary test cases', () => {
  const gen = new SyntheticTestGenerator();
  const cases = gen.generateDpTestCases('house-robber');
  assert.strictEqual(cases.length, 4);
  assert.strictEqual(cases.some(c => c.category === 'boundary'), true);
  assert.strictEqual(cases.some(c => c.category === 'adversarial'), true);
});
