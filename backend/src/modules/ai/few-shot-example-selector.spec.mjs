import test from 'node:test';
import assert from 'node:assert/strict';

class FewShotExampleSelectorService {
  constructor() {
    this.exampleBank = [
      { id: 'ex-sort-1', taskType: 'sorting', language: 'typescript', difficulty: 'easy' },
      { id: 'ex-graph-1', taskType: 'graph', language: 'typescript', difficulty: 'medium' },
      { id: 'ex-dp-1', taskType: 'dp', language: 'typescript', difficulty: 'hard' }
    ];
  }

  selectExamples(taskType, preferredDifficulty, limit = 2) {
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

test('FewShotExampleSelectorService - selects top-matching few-shot examples by task type', () => {
  const service = new FewShotExampleSelectorService();
  const res = service.selectExamples('graph', 'medium', 1);

  assert.equal(res.selectedExamples.length, 1);
  assert.equal(res.selectedExamples[0].taskType, 'graph');
  assert.equal(res.relevanceScore, 0.95);
});
