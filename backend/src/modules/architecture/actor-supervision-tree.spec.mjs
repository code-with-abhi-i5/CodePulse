import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ActorSupervisionTree } from './actor-supervision-tree.service.ts';

describe('ActorSupervisionTree [ARCH-CORE-004]', () => {
  test('restarts crashed child actor under OneForOne strategy', () => {
    const tree = new ActorSupervisionTree('ONE_FOR_ONE', 3);
    tree.registerActor('executor_1');
    tree.registerActor('executor_2');

    const result = tree.handleCrash('executor_1');
    assert.equal(result.action, 'RESTARTED');
    assert.deepEqual(result.affected, ['executor_1']);
    assert.equal(tree.getActorState('executor_1')?.state, 'RUNNING');
  });

  test('escalates when actor exceeds maximum restart count', () => {
    const tree = new ActorSupervisionTree('ONE_FOR_ONE', 1);
    tree.registerActor('executor_buggy');

    tree.handleCrash('executor_buggy'); // restart 1
    const res = tree.handleCrash('executor_buggy'); // restart 2 -> exceeds max=1
    assert.equal(res.action, 'ESCALATED');
  });
});
