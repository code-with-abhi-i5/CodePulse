import test from 'node:test';
import assert from 'node:assert/strict';

class TcpConnectionPoolRecycler {
  constructor(maxIdleTimeMs = 30000) {
    this.maxIdleTimeMs = maxIdleTimeMs;
  }

  evaluatePool(stats) {
    if (stats.idleSockets > 20 && stats.maxAgeMs > this.maxIdleTimeMs) {
      const socketsToClose = Math.floor(stats.idleSockets * 0.5);
      return {
        socketsToClose,
        reclaimedPorts: socketsToClose
      };
    }
    return {
      socketsToClose: 0,
      reclaimedPorts: 0
    };
  }
}

test('TcpConnectionPoolRecycler - reclaims idle sockets to prevent TIME_WAIT port exhaustion', () => {
  const recycler = new TcpConnectionPoolRecycler(30000);
  const decision = recycler.evaluatePool({ activeSockets: 10, idleSockets: 40, maxAgeMs: 45000 });
  assert.strictEqual(decision.socketsToClose, 20);
  assert.strictEqual(decision.reclaimedPorts, 20);
});
