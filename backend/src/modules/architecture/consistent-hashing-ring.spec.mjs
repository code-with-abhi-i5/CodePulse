import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ConsistentHashingRing } from './consistent-hashing-ring.service.ts';

describe('ConsistentHashingRing [ARCH-CORE-029]', () => {
  test('maps keys consistently to ring nodes', () => {
    const ring = new ConsistentHashingRing(50);
    ring.addNode('node-1');
    ring.addNode('node-2');
    ring.addNode('node-3');

    const nodeA = ring.getNode('battle_match_1001');
    const nodeA2 = ring.getNode('battle_match_1001');
    assert.ok(nodeA);
    assert.equal(nodeA, nodeA2);
  });

  test('preserves key locality when node is added or removed', () => {
    const ring = new ConsistentHashingRing(50);
    ring.addNode('node-1');
    ring.addNode('node-2');

    const initialKeys = Array.from({ length: 50 }, (_, i) => `key_${i}`);
    const initialMapping = initialKeys.map(k => ({ key: k, node: ring.getNode(k) }));

    ring.addNode('node-3');
    let moved = 0;
    for (const item of initialMapping) {
      const newNode = ring.getNode(item.key);
      if (newNode !== item.node) moved++;
    }

    // Only ~1/3 of keys should migrate to the 3rd node
    assert.ok(moved < 25, `Expected fewer than 25 keys moved, got ${moved}`);
  });

  test('returns multiple distinct replication nodes for high availability', () => {
    const ring = new ConsistentHashingRing(40);
    ring.addNode('n1');
    ring.addNode('n2');
    ring.addNode('n3');

    const replicas = ring.getReplicationNodes('important_session_state', 3);
    assert.equal(replicas.length, 3);
    assert.equal(new Set(replicas).size, 3);
  });
});
