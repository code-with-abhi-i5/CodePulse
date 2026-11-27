import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EventMeshTopicRouter } from './event-mesh-partition-router.service.ts';

describe('EventMeshTopicRouter [ARCH-CORE-024]', () => {
  test('routes events with same partition key to identical partition preserving order', () => {
    const router = new EventMeshTopicRouter(4);
    const key = 'battle_room_104';
    const pId1 = router.computePartition(key);
    const pId2 = router.computePartition(key);
    assert.equal(pId1, pId2);

    router.publish('battle.state', key, { step: 1 });
    router.publish('battle.state', key, { step: 2 });

    const batch = router.consumePartition(pId1);
    assert.equal(batch.length, 2);
    assert.equal(batch[0].payload.step, 1);
    assert.equal(batch[1].payload.step, 2);
  });

  test('distributes diverse keys across multiple partitions', () => {
    const router = new EventMeshTopicRouter(4);
    const partitions = new Set();
    for (let i = 0; i < 20; i++) {
      const p = router.computePartition(`user_${i}`);
      partitions.add(p);
    }
    assert.ok(partitions.size > 1);
  });
});
