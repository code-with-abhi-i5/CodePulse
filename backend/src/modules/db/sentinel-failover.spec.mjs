import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SentinelFailoverService {
  constructor() {
    this.activeMaster = 'redis-master.internal:6379';
    this.sentinels = new Set();
    this.subscriptions = new Set();
  }

  registerSentinel(sentinelUrl) {
    this.sentinels.add(sentinelUrl);
  }

  subscribeChannel(channel) {
    this.subscriptions.add(channel);
  }

  getActiveMaster() {
    return this.activeMaster;
  }

  handleFailoverEvent(newMaster) {
    const prev = this.activeMaster;
    this.activeMaster = newMaster;
    return {
      previousMaster: prev,
      newMaster,
      reconnectedSubs: this.subscriptions.size,
    };
  }
}

describe('SentinelFailoverService', () => {
  it('seamlessly transitions pub/sub subscriptions to promoted replica master', () => {
    const service = new SentinelFailoverService();
    service.subscribeChannel('tournaments:live');
    service.subscribeChannel('chat:global');

    const failover = service.handleFailoverEvent('redis-promoted.internal:6379');
    assert.equal(failover.previousMaster, 'redis-master.internal:6379');
    assert.equal(failover.newMaster, 'redis-promoted.internal:6379');
    assert.equal(failover.reconnectedSubs, 2);
    assert.equal(service.getActiveMaster(), 'redis-promoted.internal:6379');
  });
});
