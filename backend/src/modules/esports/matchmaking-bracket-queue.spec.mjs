import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MatchmakingBracketQueueService {
  constructor() {
    this.queue = [];
  }

  enqueue(player) {
    this.queue.push(player);
  }

  findMatch(playerId, currentTime) {
    const pIdx = this.queue.findIndex(p => p.id === playerId);
    if (pIdx === -1) return null;

    const player = this.queue[pIdx];
    const waitedSec = Math.floor((currentTime - player.enqueuedAt) / 1000);
    const maxDelta = 50 + waitedSec * 10;

    for (let i = 0; i < this.queue.length; i++) {
      if (i === pIdx) continue;
      const candidate = this.queue[i];
      const delta = Math.abs(player.rating - candidate.rating);
      if (delta <= maxDelta) {
        this.queue.splice(Math.max(i, pIdx), 1);
        this.queue.splice(Math.min(i, pIdx), 1);
        return {
          player1: player,
          player2: candidate,
          ratingDelta: delta,
          waitedMs: currentTime - player.enqueuedAt
        };
      }
    }
    return null;
  }

  getQueueSize() {
    return this.queue.length;
  }
}

describe('MatchmakingBracketQueueService', () => {
  it('matches candidates within rating delta and expands window over time', () => {
    const mm = new MatchmakingBracketQueueService();
    const now = Date.now();

    mm.enqueue({ id: 'p1', rating: 1500, enqueuedAt: now });
    mm.enqueue({ id: 'p2', rating: 1580, enqueuedAt: now });

    // Initially delta is 80 > 50, so no match immediately
    const noMatch = mm.findMatch('p1', now);
    assert.strictEqual(noMatch, null);

    // After 5 seconds, delta allowance expands to 50 + 50 = 100
    const match = mm.findMatch('p1', now + 5000);
    assert.ok(match !== null);
    assert.strictEqual(match.player1.id, 'p1');
    assert.strictEqual(match.player2.id, 'p2');
    assert.strictEqual(match.ratingDelta, 80);
    assert.strictEqual(mm.getQueueSize(), 0);
  });
});
