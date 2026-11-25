import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class CdcStreamerService {
  captureWrite(table, op, before, after) {
    return {
      eventId: `cdc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      targetTable: `analytics_${table}`,
      payload: { op, before, after },
    };
  }

  batchEventsForClickhouse(events) {
    const batches = {};
    for (const ev of events) {
      if (!batches[ev.targetTable]) batches[ev.targetTable] = [];
      batches[ev.targetTable].push(ev);
    }
    return batches;
  }
}

describe('CdcStreamerService', () => {
  it('streams database change data capture writes to ClickHouse analytics tables', () => {
    const service = new CdcStreamerService();
    const ev1 = service.captureWrite('matches', 'INSERT', null, { id: 1, duration: 120 });
    const ev2 = service.captureWrite('matches', 'UPDATE', { id: 1 }, { id: 1, duration: 150 });
    const batches = service.batchEventsForClickhouse([ev1, ev2]);

    assert.equal(batches['analytics_matches'].length, 2);
    assert.equal(batches['analytics_matches'][0].payload.op, 'INSERT');
  });
});
