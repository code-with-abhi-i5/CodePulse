import test from 'node:test';
import assert from 'node:assert/strict';

class DistributedDeadlockDetector {
  constructor() {
    this.claims = [];
  }

  addClaim(claim) {
    this.claims.push(claim);
  }

  detectDeadlocks() {
    const resourceHolders = new Map();
    for (const c of this.claims) {
      if (c.status === 'held') {
        resourceHolders.set(c.resourceId, c.transactionId);
      }
    }

    const waitGraph = new Map();
    for (const c of this.claims) {
      if (c.status === 'waiting') {
        const holder = resourceHolders.get(c.resourceId);
        if (holder && holder !== c.transactionId) {
          if (!waitGraph.has(c.transactionId)) waitGraph.set(c.transactionId, []);
          waitGraph.get(c.transactionId).push(holder);
        }
      }
    }

    const visited = new Set();
    const recStack = new Set();

    const dfs = (node, path) => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = waitGraph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const cycle = dfs(neighbor, [...path]);
          if (cycle) return cycle;
        } else if (recStack.has(neighbor)) {
          return [...path, neighbor];
        }
      }

      recStack.delete(node);
      return null;
    };

    for (const node of waitGraph.keys()) {
      if (!visited.has(node)) {
        const cycle = dfs(node, []);
        if (cycle) {
          return {
            hasDeadlock: true,
            cycle,
            victimTransactionId: cycle[0]
          };
        }
      }
    }

    return {
      hasDeadlock: false,
      cycle: [],
      victimTransactionId: null
    };
  }

  clear() {
    this.claims = [];
  }
}

test('DistributedDeadlockDetector - identifies circular wait-for deadlock cycles', () => {
  const detector = new DistributedDeadlockDetector();

  // Tx1 holds ResA, waits on ResB
  // Tx2 holds ResB, waits on ResA
  detector.addClaim({ transactionId: 'tx-1', resourceId: 'res-A', status: 'held', timestamp: Date.now() });
  detector.addClaim({ transactionId: 'tx-2', resourceId: 'res-B', status: 'held', timestamp: Date.now() });
  detector.addClaim({ transactionId: 'tx-1', resourceId: 'res-B', status: 'waiting', timestamp: Date.now() });
  detector.addClaim({ transactionId: 'tx-2', resourceId: 'res-A', status: 'waiting', timestamp: Date.now() });

  const result = detector.detectDeadlocks();
  assert.strictEqual(result.hasDeadlock, true);
  assert.ok(result.victimTransactionId !== null);
  assert.ok(result.cycle.length >= 2);
});
