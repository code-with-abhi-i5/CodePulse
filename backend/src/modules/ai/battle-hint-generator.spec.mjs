import test from 'node:test';
import assert from 'node:assert/strict';

class BattleHintGeneratorService {
  generateTieredHint(problemCategory, tier) {
    const hintCatalog = {
      'hashmap': {
        1: { hint: 'Can you store previously visited values so you can look them up in O(1) time?', direction: 'Lookup optimization' },
        2: { hint: 'Consider mapping each element to its index as you iterate through the list.', direction: 'Key-value mapping' },
        3: { hint: 'Check if the complement (target - current_value) exists in your map before storing the current element.', direction: 'Complement lookup pattern' }
      },
      'dp': {
        1: { hint: 'Does the optimal solution for size N depend on optimal sub-solutions for sizes smaller than N?', direction: 'Optimal substructure' },
        2: { hint: 'Define dp[i] as the minimum or maximum value attainable at index i.', direction: 'Recurrence relation formulation' },
        3: { hint: 'Iterate from base cases up to N, updating dp[i] = max(dp[i-1], dp[i-2] + current_cost).', direction: 'Bottom-up memoization' }
      }
    };

    const categoryHints = hintCatalog[problemCategory] || hintCatalog['hashmap'];
    const selected = categoryHints[tier] || categoryHints[1];

    return {
      tier,
      hintMessage: selected.hint,
      conceptualDirection: selected.direction,
      revealsDirectSolution: false
    };
  }
}

test('BattleHintGeneratorService - emits tiered progressive pedagogical hints without answer', () => {
  const service = new BattleHintGeneratorService();
  const t1 = service.generateTieredHint('hashmap', 1);
  assert.equal(t1.tier, 1);
  assert.equal(t1.revealsDirectSolution, false);
  assert.ok(t1.hintMessage.includes('O(1)'));

  const t3 = service.generateTieredHint('dp', 3);
  assert.equal(t3.tier, 3);
  assert.equal(t3.revealsDirectSolution, false);
  assert.ok(t3.hintMessage.includes('dp[i]'));
});
