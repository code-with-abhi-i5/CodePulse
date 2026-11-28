import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class LogicalReplicationConsumerService {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(table, handler) {
    const existing = this.subscribers.get(table) || [];
    existing.push(handler);
    this.subscribers.set(table, existing);
  }

  parseWal2JsonPayload(rawPayload) {
    const events = [];
    const txId = rawPayload.xid || Date.now();
    const commitTimestamp = rawPayload.timestamp ? Date.parse(rawPayload.timestamp) : Date.now();

    for (const item of rawPayload.change) {
      const data = {};
      if (item.columnnames && item.columnvalues) {
        item.columnnames.forEach((col, idx) => {
          data[col] = item.columnvalues?.[idx];
        });
      }

      const action = item.kind.toUpperCase();
      events.push({
        table: item.table,
        action,
        commitTimestamp,
        txId,
        data
      });
    }

    return events;
  }

  dispatchEvents(events) {
    let dispatched = 0;
    for (const event of events) {
      const handlers = this.subscribers.get(event.table);
      if (handlers && handlers.length > 0) {
        handlers.forEach(h => {
          h(event);
          dispatched++;
        });
      }
    }
    return dispatched;
  }
}

describe('LogicalReplicationConsumerService', () => {
  it('parses wal2json changes into strongly-typed replication events', () => {
    const service = new LogicalReplicationConsumerService();
    const payload = {
      xid: 10543,
      timestamp: '2026-11-26T12:00:00Z',
      change: [
        {
          kind: 'insert',
          schema: 'public',
          table: 'tournaments',
          columnnames: ['id', 'name', 'status'],
          columnvalues: [101, 'Championship 2026', 'ACTIVE']
        }
      ]
    };

    const events = service.parseWal2JsonPayload(payload);
    assert.equal(events.length, 1);
    assert.equal(events[0].table, 'tournaments');
    assert.equal(events[0].action, 'INSERT');
    assert.equal(events[0].txId, 10543);
    assert.equal(events[0].data.name, 'Championship 2026');
  });

  it('subscribes and dispatches events to registered event handlers', () => {
    const service = new LogicalReplicationConsumerService();
    const received = [];

    service.subscribe('tournaments', (ev) => received.push(ev));

    const events = [
      { table: 'tournaments', action: 'UPDATE', commitTimestamp: 1000, txId: 1, data: { id: 101, status: 'FINISHED' } },
      { table: 'unrelated_table', action: 'INSERT', commitTimestamp: 1001, txId: 2, data: {} }
    ];

    const dispatchedCount = service.dispatchEvents(events);
    assert.equal(dispatchedCount, 1);
    assert.equal(received.length, 1);
    assert.equal(received[0].data.status, 'FINISHED');
  });
});
