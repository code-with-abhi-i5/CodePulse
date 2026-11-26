import { LockClaim, DeadlockDetectionResult } from '../../types/sre';

export class DistributedDeadlockDetector {
  private claims: LockClaim[] = [];

  addClaim(claim: LockClaim): void {
    this.claims.push(claim);
  }

  detectDeadlocks(): DeadlockDetectionResult {
    // Build adjacency list: who is waiting on whom?
    // Tx A holds R1, Tx B waits on R1 -> edge B -> A
    const resourceHolders = new Map<string, string>();
    for (const c of this.claims) {
      if (c.status === 'held') {
        resourceHolders.set(c.resourceId, c.transactionId);
      }
    }

    const waitGraph = new Map<string, string[]>();
    for (const c of this.claims) {
      if (c.status === 'waiting') {
        const holder = resourceHolders.get(c.resourceId);
        if (holder && holder !== c.transactionId) {
          if (!waitGraph.has(c.transactionId)) waitGraph.set(c.transactionId, []);
          waitGraph.get(c.transactionId)!.push(holder);
        }
      }
    }

    // Cycle detection via DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]): string[] | null => {
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

  clear(): void {
    this.claims = [];
  }
}
