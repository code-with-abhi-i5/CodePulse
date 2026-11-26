import test from 'node:test';
import assert from 'node:assert/strict';

class ConnectionLeakSentryService {
  constructor(maxDuration = 10000) {
    this.leased = new Map();
    this.maxDuration = maxDuration;
  }
  lease(id, context) {
    this.leased.set(id, { acquiredAt: Date.now(), context });
  }
  release(id) {
    this.leased.delete(id);
  }
  scan(simulatedNow) {
    const leaked = [];
    for (const [id, rec] of this.leased.entries()) {
      const held = simulatedNow - rec.acquiredAt;
      if (held > this.maxDuration) leaked.push({ id, held, isLeaked: true });
    }
    return leaked;
  }
}

test('ConnectionLeakSentryService - detects connections held past max duration threshold', () => {
  const sentry = new ConnectionLeakSentryService(5000);
  const now = Date.now();
  sentry.lease('conn-1', 'GET /battle/match');

  const leaksBefore = sentry.scan(now + 2000);
  assert.equal(leaksBefore.length, 0);

  const leaksAfter = sentry.scan(now + 6000);
  assert.equal(leaksAfter.length, 1);
  assert.equal(leaksAfter[0].id, 'conn-1');
});
