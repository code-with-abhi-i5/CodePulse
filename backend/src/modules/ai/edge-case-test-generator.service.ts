import { EdgeCaseTestFixture } from '../../types/ai';

export class EdgeCaseTestGeneratorService {
  generateEdgeCases(paramTypes: string[]): EdgeCaseTestFixture[] {
    const fixtures: EdgeCaseTestFixture[] = [];

    for (let i = 0; i < paramTypes.length; i++) {
      const type = paramTypes[i].toLowerCase();
      if (type.includes('[]') || type.includes('array')) {
        fixtures.push({ testName: 'empty array', inputArguments: [[]], expectedCondition: 'handles 0-length collection' });
        fixtures.push({ testName: 'single-element array', inputArguments: [[42]], expectedCondition: 'handles boundary length 1' });
      } else if (type.includes('string')) {
        fixtures.push({ testName: 'empty string input', inputArguments: [''], expectedCondition: 'handles empty input gracefully' });
        fixtures.push({ testName: 'whitespace string input', inputArguments: ['   '], expectedCondition: 'trims or validates whitespace' });
      } else if (type.includes('number')) {
        fixtures.push({ testName: 'zero value', inputArguments: [0], expectedCondition: 'correctly handles zero without division by zero' });
        fixtures.push({ testName: 'negative value', inputArguments: [-1], expectedCondition: 'handles negative integer' });
        fixtures.push({ testName: 'max safe integer', inputArguments: [Number.MAX_SAFE_INTEGER], expectedCondition: 'no integer overflow' });
      }
    }

    if (fixtures.length === 0) {
      fixtures.push({ testName: 'null parameter test', inputArguments: [null], expectedCondition: 'null safety validation' });
    }

    return fixtures;
  }
}
