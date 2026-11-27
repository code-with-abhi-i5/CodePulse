import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SWIMMembershipGossiperService } from './swim-membership-gossiper.service.ts';

describe('SWIMMembershipGossiperService [ARCH-CORE-035]', () => {
  test('manages membership and detects suspect state with failure transitions', () => {
    const nodeA = new SWIMMembershipGossiperService('node_a', '10.0.0.1', 8000, 1000);
    nodeA.registerMember('node_b', '10.0.0.2', 8000);

    assert.equal(nodeA.getAliveMembers().length, 2);

    nodeA.markSuspect('node_b', 1);
    assert.equal(nodeA.getMember('node_b')?.status, 'SUSPECT');
    assert.equal(nodeA.getAliveMembers().length, 1);

    // Timeout transition from SUSPECT to DEAD
    const dead = nodeA.checkSuspectTimeouts(Date.now() + 2000);
    assert.deepEqual(dead, ['node_b']);
    assert.equal(nodeA.getMember('node_b')?.status, 'DEAD');
  });

  test('refutes false suspicion when local node is reported suspect', () => {
    const nodeA = new SWIMMembershipGossiperService('node_a');
    nodeA.markSuspect('node_a', 3);

    const self = nodeA.getMember('node_a');
    assert.equal(self?.status, 'ALIVE');
    assert.ok((self?.incarnation ?? 0) >= 4, 'Incarnation incremented to refute false suspicion');
  });

  test('reconciles higher incarnation gossip messages', () => {
    const nodeA = new SWIMMembershipGossiperService('node_a');
    nodeA.registerMember('node_c', '10.0.0.3', 8000);

    nodeA.processGossipUpdates([
      { id: 'node_c', address: '10.0.0.3', port: 8000, status: 'ALIVE', incarnation: 5, lastUpdated: Date.now() }
    ]);
    assert.equal(nodeA.getMember('node_c')?.incarnation, 5);
  });
});
