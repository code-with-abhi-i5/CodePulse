import assert from 'node:assert/strict';
import test from 'node:test';

class ZombiePrunerService {
  constructor() {
    this.sessions = new Map();
    this.TIMEOUT_MS = 45000;
  }

  registerPing(socketId, customTime = Date.now()) {
    this.sessions.set(socketId, { socketId, lastPingAt: customTime, missedPings: 0, isHealthy: true });
  }

  pruneOrphanedSockets(currentTime = Date.now()) {
    const pruned = [];
    for (const [socketId, session] of this.sessions.entries()) {
      if (currentTime - session.lastPingAt > this.TIMEOUT_MS) {
        pruned.push(socketId);
        this.sessions.delete(socketId);
      }
    }
    return pruned;
  }

  getActiveSessionCount() {
    return this.sessions.size;
  }
}

test('ZombiePrunerService: reaps orphaned sockets after 45s of missed keepalive pings', () => {
  const pruner = new ZombiePrunerService();
  const now = Date.now();
  pruner.registerPing('sock-healthy', now);
  pruner.registerPing('sock-zombie', now - 50000); // 50 seconds old

  assert.equal(pruner.getActiveSessionCount(), 2);
  const pruned = pruner.pruneOrphanedSockets(now);

  assert.deepEqual(pruned, ['sock-zombie']);
  assert.equal(pruner.getActiveSessionCount(), 1);
});
