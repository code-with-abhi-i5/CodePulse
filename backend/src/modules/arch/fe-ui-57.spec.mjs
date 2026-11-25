import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ChallengeDependencyGraphService } from './fe-ui-57.service.ts';

describe('ChallengeDependencyGraphService (FE-UI-57)', () => {
  it('detects cycles in prerequisite dependencies', () => {
    const graph = new ChallengeDependencyGraphService();
    graph.addChallenge({ id: 'c1', title: 'Intro', prerequisites: ['c2'] });
    graph.addChallenge({ id: 'c2', title: 'Variables', prerequisites: ['c1'] });

    assert.strictEqual(graph.detectCycle(), true);
  });

  it('calculates unlocked challenges based on completed history', () => {
    const graph = new ChallengeDependencyGraphService();
    graph.addChallenge({ id: 'intro', title: 'Intro', prerequisites: [] });
    graph.addChallenge({ id: 'loops', title: 'Loops', prerequisites: ['intro'] });
    graph.addChallenge({ id: 'dp', title: 'DP', prerequisites: ['loops'] });

    const unlocked1 = graph.getUnlockedChallenges([]);
    assert.strictEqual(unlocked1.length, 1);
    assert.strictEqual(unlocked1[0].id, 'intro');

    const unlocked2 = graph.getUnlockedChallenges(['intro']);
    assert.strictEqual(unlocked2.length, 1);
    assert.strictEqual(unlocked2[0].id, 'loops');
  });
});
