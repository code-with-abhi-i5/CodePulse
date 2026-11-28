import { TieredHintResult } from '../../types/ai';

export class BattleHintGeneratorService {
  generateTieredHint(problemCategory: 'sorting' | 'graph' | 'dp' | 'hashmap' | 'two-pointer', tier: 1 | 2 | 3): TieredHintResult {
    const hintCatalog: Record<string, Record<number, { hint: string; direction: string }>> = {
      'hashmap': {
        1: { hint: 'Can you store previously visited values so you can look them up in O(1) time?', direction: 'Lookup optimization' },
        2: { hint: 'Consider mapping each element to its index as you iterate through the list.', direction: 'Key-value mapping' },
        3: { hint: 'Check if the complement (target - current_value) exists in your map before storing the current element.', direction: 'Complement lookup pattern' }
      },
      'two-pointer': {
        1: { hint: 'Would sorting or approaching from both boundaries help narrow down candidates?', direction: 'Boundary convergence' },
        2: { hint: 'Maintain two indices starting at opposite ends and move them inward based on condition comparisons.', direction: 'Inward pointer movement' },
        3: { hint: 'If the current sum is less than target, advance the left pointer; if greater, decrement the right pointer.', direction: 'Comparison branch step' }
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
