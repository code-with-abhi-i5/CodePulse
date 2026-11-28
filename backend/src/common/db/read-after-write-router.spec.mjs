import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ReadAfterWriteRouterService {
  constructor(consistencyWindowMs = 3000) {
    this.consistencyWindowMs = consistencyWindowMs;
    this.writeTimestamps = new Map();
  }

  recordWrite(sessionOrUserId, timestamp = Date.now()) {
    this.writeTimestamps.set(sessionOrUserId, timestamp);
  }

  routeRead(sessionOrUserId, now = Date.now()) {
    const lastWrite = this.writeTimestamps.get(sessionOrUserId);

    if (lastWrite !== undefined) {
      const elapsed = now - lastWrite;
      if (elapsed < this.consistencyWindowMs) {
        return {
          targetNode: 'primary',
          reason: 'recent_write_window',
          windowRemainingMs: this.consistencyWindowMs - elapsed
        };
      } else {
        this.writeTimestamps.delete(sessionOrUserId);
      }
    }

    return {
      targetNode: 'replica',
      reason: 'replica_healthy'
    };
  }

  clear(sessionOrUserId) {
    this.writeTimestamps.delete(sessionOrUserId);
  }
}

describe('ReadAfterWriteRouterService', () => {
  const router = new ReadAfterWriteRouterService(3000);

  it('routes reads to replica when no recent writes recorded', () => {
    const decision = router.routeRead('user-1', 1000);
    assert.equal(decision.targetNode, 'replica');
    assert.equal(decision.reason, 'replica_healthy');
  });

  it('routes reads to primary during the consistency window after write', () => {
    router.recordWrite('user-2', 5000);

    const withinWindow = router.routeRead('user-2', 6000);
    assert.equal(withinWindow.targetNode, 'primary');
    assert.equal(withinWindow.reason, 'recent_write_window');
    assert.equal(withinWindow.windowRemainingMs, 2000);

    const afterWindow = router.routeRead('user-2', 8500);
    assert.equal(afterWindow.targetNode, 'replica');
    assert.equal(afterWindow.reason, 'replica_healthy');
  });

  it('supports explicit clearing of sticky write window', () => {
    router.recordWrite('user-3', 10000);
    router.clear('user-3');
    const decision = router.routeRead('user-3', 10500);
    assert.equal(decision.targetNode, 'replica');
  });
});
