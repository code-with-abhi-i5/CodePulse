import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedBarrierCoordinator } from './distributed-barrier.service.ts';

describe('DistributedBarrierCoordinator [ARCH-CORE-010]', () => {
  test('synchronizes participant arrival and releases upon barrier satisfaction', () => {
    const barrier = new DistributedBarrierCoordinator(3);
    assert.equal(barrier.arrive('agent_1'), false);
    assert.equal(barrier.arrive('agent_2'), false);
    assert.equal(barrier.isReady(), false);

    assert.equal(barrier.arrive('agent_3'), true);
    assert.equal(barrier.isReady(), true);

    barrier.reset();
    assert.equal(barrier.isReady(), false);
  });
});
