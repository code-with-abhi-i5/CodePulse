import { SyntheticTestCase } from '../../types/ai';

export class SyntheticTestGenerator {
  generateDpTestCases(problemType: string): SyntheticTestCase[] {
    return [
      { input: '[]', expectedOutput: '0', category: 'boundary' },
      { input: '[0]', expectedOutput: '0', category: 'boundary' },
      { input: '[1, 2, 3, 1]', expectedOutput: '4', category: 'adversarial' },
      { input: Array.from({ length: 1000 }, () => 1).join(','), expectedOutput: '1000', category: 'performance' }
    ];
  }
}
