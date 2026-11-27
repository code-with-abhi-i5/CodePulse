import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RaftLogReplicator } from './raft-log-replicator.service.ts';

describe('RaftLogReplicator [ARCH-CORE-001]', () => {
  test('appends entries sequentially with current term and index', () => {
    const raft = new RaftLogReplicator();
    const e1 = raft.append('CREATE_ROOM');
    const e2 = raft.append('START_MATCH');

    assert.equal(e1.index, 1);
    assert.equal(e2.index, 2);
    assert.equal(raft.getLogLength(), 2);
  });

  test('validates log consistency during peer AppendEntries reconciliation', () => {
    const follower = new RaftLogReplicator();
    follower.append('ENTRY_1');

    const success = follower.handleAppendEntries(1, 1, 1, [
      { term: 1, index: 2, command: 'ENTRY_2' }
    ]);
    assert.equal(success, true);
    assert.equal(follower.getLogLength(), 2);
  });
});
