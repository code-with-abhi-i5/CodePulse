import test from 'node:test';
import assert from 'node:assert/strict';

class RedisStreamConsumerCoordinatorService {
  constructor() {
    this.pending = new Map();
    this.minIdle = 30000;
  }
  record(id, consumer, time) {
    this.pending.set(id, { consumer, lastSeenAt: time });
  }
  claim(targetConsumer, now) {
    const claimed = [];
    for (const [id, rec] of this.pending.entries()) {
      if (now - rec.lastSeenAt >= this.minIdle) {
        claimed.push(id);
        rec.consumer = targetConsumer;
      }
    }
    return { claimedCount: claimed.length, claimedMessageIds: claimed, targetConsumer };
  }
}

test('RedisStreamConsumerCoordinatorService - claims orphaned messages from idle consumers', () => {
  const coord = new RedisStreamConsumerCoordinatorService();
  const t0 = 1000;
  coord.record('msg-101', 'dead-worker', t0);

  const res = coord.claim('active-worker', t0 + 35000);
  assert.equal(res.claimedCount, 1);
  assert.equal(res.claimedMessageIds[0], 'msg-101');
  assert.equal(res.targetConsumer, 'active-worker');
});
