import { FewShotExample, FewShotSelectionResult } from '../../types/ai';

export class FewShotExampleSelectorService {
  private readonly exampleBank: FewShotExample[] = [
    {
      id: 'ex-sort-1',
      taskType: 'sorting',
      language: 'typescript',
      difficulty: 'easy',
      prompt: 'Sort an array of numbers in ascending order.',
      solution: 'arr.sort((a, b) => a - b);'
    },
    {
      id: 'ex-graph-1',
      taskType: 'graph',
      language: 'typescript',
      difficulty: 'medium',
      prompt: 'Traverse an undirected graph using BFS.',
      solution: 'const queue = [start]; while (queue.length) { ... }'
    },
    {
      id: 'ex-dp-1',
      taskType: 'dp',
      language: 'typescript',
      difficulty: 'hard',
      prompt: 'Find max profit in 0/1 knapsack.',
      solution: 'const dp = Array.from(...);'
    },
    {
      id: 'ex-string-1',
      taskType: 'string',
      language: 'typescript',
      difficulty: 'easy',
      prompt: 'Reverse words in a sentence.',
      solution: 'sentence.split(" ").reverse().join(" ");'
    }
  ];

  selectExamples(taskType: string, preferredDifficulty?: string, limit: number = 2): FewShotSelectionResult {
    const filtered = this.exampleBank.filter(ex => {
      const matchType = ex.taskType === taskType;
      const matchDiff = !preferredDifficulty || ex.difficulty === preferredDifficulty;
      return matchType && matchDiff;
    });

    const candidates = filtered.length > 0 ? filtered : this.exampleBank.filter(ex => ex.taskType === taskType);
    const selected = (candidates.length > 0 ? candidates : this.exampleBank).slice(0, limit);

    return {
      selectedExamples: selected,
      retrievalStrategy: 'task-type-weighted-filter',
      relevanceScore: selected.length > 0 ? 0.95 : 0.50
    };
  }
}
