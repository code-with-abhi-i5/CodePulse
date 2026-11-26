import test from 'node:test';
import assert from 'node:assert/strict';

class GracefulShutdownCoordinator {
  constructor() {
    this.inFlight = new Map();
    this.state = 'running';
    this.drainedCount = 0;
  }

  trackMessage(msg) {
    if (this.state !== 'running') {
      return false;
    }
    this.inFlight.set(msg.messageId, msg);
    return true;
  }

  ackMessage(messageId) {
    if (this.inFlight.delete(messageId)) {
      this.drainedCount++;
    }
  }

  async initiateShutdown(graceTimeoutMs = 5000) {
    const startTime = Date.now();
    this.state = 'shutting_down';

    const checkIntervalMs = 25;
    let elapsed = 0;
    let forcedClose = false;

    while (this.inFlight.size > 0 && elapsed < graceTimeoutMs) {
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      elapsed = Date.now() - startTime;
    }

    if (this.inFlight.size > 0) {
      forcedClose = true;
      this.inFlight.clear();
    }

    this.state = 'terminated';
    return {
      state: 'terminated',
      inFlightCount: 0,
      drainedCount: this.drainedCount,
      forcedClose,
      durationMs: Date.now() - startTime
    };
  }

  getStatus() {
    return {
      state: this.state,
      inFlightCount: this.inFlight.size,
      drainedCount: this.drainedCount,
      forcedClose: false,
      durationMs: 0
    };
  }
}

test('GracefulShutdownCoordinator - drains in-flight socket messages prior to termination', async () => {
  const coordinator = new GracefulShutdownCoordinator();
  assert.strictEqual(coordinator.trackMessage({ messageId: 'm1', connectionId: 'ws-1', payloadSize: 64, queuedAt: Date.now() }), true);

  const shutdownPromise = coordinator.initiateShutdown(1000);
  assert.strictEqual(coordinator.trackMessage({ messageId: 'm2', connectionId: 'ws-2', payloadSize: 64, queuedAt: Date.now() }), false);

  coordinator.ackMessage('m1');
  const res = await shutdownPromise;

  assert.strictEqual(res.state, 'terminated');
  assert.strictEqual(res.drainedCount, 1);
  assert.strictEqual(res.forcedClose, false);
});
