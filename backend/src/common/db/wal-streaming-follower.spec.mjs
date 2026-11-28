import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class WalStreamingFollowerService {
  constructor() {
    this.lastCommittedLsn = '0/0';
  }

  processWalChange(rawChange) {
    this.lastCommittedLsn = rawChange.lsn;
    return {
      lsn: rawChange.lsn,
      transactionId: rawChange.xid,
      table: rawChange.table,
      operation: rawChange.kind.toUpperCase(),
      documentId: rawChange.rowId,
      payload: rawChange.data
    };
  }

  toSearchIndexAction(event, indexName) {
    if (event.operation === 'DELETE') {
      return {
        action: 'delete',
        metadata: { _index: indexName, _id: event.documentId }
      };
    }

    return {
      action: 'index',
      metadata: { _index: indexName, _id: event.documentId },
      source: event.payload
    };
  }

  getLastLsn() {
    return this.lastCommittedLsn;
  }
}

describe('WalStreamingFollowerService', () => {
  const service = new WalStreamingFollowerService();

  it('processes WAL change stream records and updates tracking LSN', () => {
    const raw = {
      lsn: '0/15E3840',
      xid: 4892,
      table: 'challenges',
      kind: 'insert',
      rowId: 'ch-101',
      data: { title: 'Dynamic Programming', difficulty: 'HARD' }
    };

    const event = service.processWalChange(raw);
    assert.equal(event.operation, 'INSERT');
    assert.equal(event.documentId, 'ch-101');
    assert.equal(service.getLastLsn(), '0/15E3840');
  });

  it('translates insert/update events into search index payloads', () => {
    const event = {
      lsn: '0/15E3840',
      transactionId: 4892,
      table: 'challenges',
      operation: 'UPDATE',
      documentId: 'ch-101',
      payload: { title: 'Updated' }
    };

    const action = service.toSearchIndexAction(event, 'challenges_v1');
    assert.equal(action.action, 'index');
    assert.equal(action.metadata._id, 'ch-101');
    assert.equal(action.source.title, 'Updated');
  });

  it('translates delete events into search delete actions', () => {
    const event = {
      lsn: '0/15E3850',
      transactionId: 4893,
      table: 'challenges',
      operation: 'DELETE',
      documentId: 'ch-101',
      payload: {}
    };

    const action = service.toSearchIndexAction(event, 'challenges_v1');
    assert.equal(action.action, 'delete');
    assert.equal(action.metadata._id, 'ch-101');
  });
});
