import assert from 'node:assert/strict';
import test from 'node:test';

class ReconnectBackoffService {
  constructor() {
    this.clientStates = new Map();
  }

  getNextBackoffMs(clientId) {
    let state = this.clientStates.get(clientId);
    if (!state) {
      state = { attempts: 0, queue: [] };
      this.clientStates.set(clientId, state);
    }
    state.attempts++;
    const base = Math.min(1000 * Math.pow(2, state.attempts - 1), 30000);
    return base;
  }

  enqueueMessage(clientId, msg) {
    let state = this.clientStates.get(clientId);
    if (!state) {
      state = { attempts: 0, queue: [] };
      this.clientStates.set(clientId, state);
    }
    state.queue.push(msg);
    return state.queue.length;
  }

  flushMessageQueue(clientId) {
    const state = this.clientStates.get(clientId);
    if (!state) return [];
    const flushed = [...state.queue];
    state.queue = [];
    state.attempts = 0;
    return flushed;
  }
}

test('ReconnectBackoffService: computes exponential backoff and flushes offline message queue', () => {
  const service = new ReconnectBackoffService();
  const b1 = service.getNextBackoffMs('client-1');
  assert.equal(b1, 1000);

  const b2 = service.getNextBackoffMs('client-1');
  assert.equal(b2, 2000);

  service.enqueueMessage('client-1', 'msg-1');
  service.enqueueMessage('client-1', 'msg-2');
  const flushed = service.flushMessageQueue('client-1');

  assert.equal(flushed.length, 2);
  assert.equal(service.flushMessageQueue('client-1').length, 0);
});
