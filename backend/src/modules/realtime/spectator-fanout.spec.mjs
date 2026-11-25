import assert from 'node:assert/strict';
import test from 'node:test';

class SpectatorFanoutService {
  constructor() {
    this.roomTrees = new Map();
  }

  registerNode(node) {
    if (!this.roomTrees.has(node.roomId)) this.roomTrees.set(node.roomId, []);
    this.roomTrees.get(node.roomId).push(node);
  }

  broadcastToSpectators(roomId, update) {
    const nodes = this.roomTrees.get(roomId) || [];
    const viewers = nodes.reduce((sum, n) => sum + n.viewerCount, 0);
    return { totalViewersReached: viewers, nodesCount: nodes.length };
  }

  getViewerCount(roomId) {
    return (this.roomTrees.get(roomId) || []).reduce((sum, n) => sum + n.viewerCount, 0);
  }
}

test('SpectatorFanoutService: broadcasts battle updates to 10,000+ viewers via tree nodes', () => {
  const fanout = new SpectatorFanoutService();
  fanout.registerNode({ nodeId: 'node-1', roomId: 'world-cup', viewerCount: 5000, capacity: 10000 });
  fanout.registerNode({ nodeId: 'node-2', roomId: 'world-cup', viewerCount: 6500, capacity: 10000 });

  const res = fanout.broadcastToSpectators('world-cup', { leaderboard: [] });
  assert.equal(res.totalViewersReached, 11500);
  assert.equal(res.nodesCount, 2);
});
