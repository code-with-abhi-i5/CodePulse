import test from 'node:test';
import assert from 'node:assert/strict';

class EdgeCaseTestGeneratorService {
  generateEdgeCases(paramTypes) {
    const fixtures = [];
    for (let i = 0; i < paramTypes.length; i++) {
      const type = paramTypes[i].toLowerCase();
      if (type.includes('[]') || type.includes('array')) {
        fixtures.push({ testName: 'empty array', inputArguments: [[]] });
      } else if (type.includes('string')) {
        fixtures.push({ testName: 'empty string input', inputArguments: [''] });
        fixtures.push({ testName: 'whitespace string input', inputArguments: ['   '] });
      } else if (type.includes('number')) {
        fixtures.push({ testName: 'zero value', inputArguments: [0] });
        fixtures.push({ testName: 'negative value', inputArguments: [-1] });
      }
    }
    return fixtures;
  }
}

test('EdgeCaseTestGeneratorService - generates edge cases for numbers, strings and arrays', () => {
  const service = new EdgeCaseTestGeneratorService();
  const cases = service.generateEdgeCases(['number', 'string[]']);
  assert.ok(cases.some(c => c.testName === 'zero value'));
  assert.ok(cases.some(c => c.testName === 'empty array'));
});
