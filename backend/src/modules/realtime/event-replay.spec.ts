import assert from 'node:assert/strict';
import test from 'node:test';

class EventReplayService {
  constructor() {
    this.stores = new Map();
  }

  appendEvent(matchId, eventType, payload) {
    if (!this.stores.has(matchId)) this.stores.set(matchId, []);
    const store = this.stores.get(matchId);
    const event = { sequenceNumber: store.length + 1, matchId, eventType, timestamp: Date.now(), payload };
    store.push(event);
    return event;
  }

  getFullMatchReplay(matchId) {
    return [...(this.stores.get(matchId) || [])];
  }

  replayFromSequence(matchId, fromSeq) {
    return (this.stores.get(matchId) || []).filter(e => e.sequenceNumber >= fromSeq);
  }
}

test('EventReplayService: stores monotonically sequenced events for full match replay', () => {
  const replay = new EventReplayService();
  replay.appendEvent('m-1', 'MATCH_START', { arena: '3d-cyber' });
  replay.appendEvent('m-1', 'KEY_STROKE', { char: 'c' });
  replay.appendEvent('m-1', 'TEST_PASS', { duration: 120 });

  const events = replay.getFullMatchReplay('m-1');
  assert.equal(events.length, 3);
  assert.equal(events[0].sequenceNumber, 1);
  assert.equal(events[2].sequenceNumber, 3);

  const partial = replay.replayFromSequence('m-1', 2);
  assert.equal(partial.length, 2);
});
