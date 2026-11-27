import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MultiRaftSplitBrainDetector } from './multi-raft-split-brain-detector.service.ts';

describe('MultiRaftSplitBrainDetector [ARCH-CORE-012]', () => {
  test('flags split-brain when multiple leaders declare same Raft group', () => {
    const detector = new MultiRaftSplitBrainDetector();
    detector.reportHeartbeat({ nodeId: 'n1', groupId: 'raft_group_1', term: 5, isLeader: true, lastHeartbeat: Date.now() });
    detector.reportHeartbeat({ nodeId: 'n2', groupId: 'raft_group_1', term: 5, isLeader: true, lastHeartbeat: Date.now() });

    const status = detector.detectSplitBrain('raft_group_1', 3);
    assert.equal(status.splitBrain, true);
    assert.deepEqual(status.leaders, ['n1', 'n2']);
  });

  test('reports clean state with single legitimate leader', () => {
    const detector = new MultiRaftSplitBrainDetector();
    detector.reportHeartbeat({ nodeId: 'n1', groupId: 'raft_group_2', term: 1, isLeader: true, lastHeartbeat: Date.now() });
    detector.reportHeartbeat({ nodeId: 'n2', groupId: 'raft_group_2', term: 1, isLeader: false, lastHeartbeat: Date.now() });

    const status = detector.detectSplitBrain('raft_group_2', 2);
    assert.equal(status.splitBrain, false);
    assert.deepEqual(status.leaders, ['n1']);
  });
});
