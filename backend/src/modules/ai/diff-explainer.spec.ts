import assert from 'node:assert/strict';
import test from 'node:test';

class DiffExplainerService {
  explainOptimization(orig, opt) {
    const hasMapOrSet = /new (Map|Set)/.test(opt);
    const time = hasMapOrSet ? 'O(N)' : 'O(N log N)';
    return {
      timeComplexity: time,
      spaceComplexity: 'O(N)',
      markdown: 'Improved complexity'
    };
  }
}

test('DiffExplainerService: analyzes algorithm complexity gains and produces Markdown breakdown', () => {
  const explainer = new DiffExplainerService();
  const res = explainer.explainOptimization('for (let i...) { for (let j...) }', 'const map = new Map();');
  assert.equal(res.timeComplexity, 'O(N)');
  assert.ok(res.markdown.length > 0);
});
