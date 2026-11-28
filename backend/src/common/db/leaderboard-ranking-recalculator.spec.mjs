import test from 'node:test';
import assert from 'node:assert/strict';

class LeaderboardRankingRecalculatorService {
  constructor() {
    this.scores = new Map();
  }
  recordScore(userId, score) {
    this.scores.set(userId, score);
  }
  calculateRank(userId) {
    const targetScore = this.scores.get(userId);
    if (targetScore === undefined) return null;
    const all = Array.from(this.scores.values()).sort((a, b) => b - a);
    const rank = all.indexOf(targetScore) + 1;
    const total = all.length;
    return { userId, score: targetScore, rank, totalParticipants: total };
  }
}

test('LeaderboardRankingRecalculatorService - calculates user rank accurately among participants', () => {
  const service = new LeaderboardRankingRecalculatorService();
  service.recordScore('u1', 500);
  service.recordScore('u2', 800);
  service.recordScore('u3', 300);

  const rank2 = service.calculateRank('u2');
  assert.equal(rank2.rank, 1);

  const rank1 = service.calculateRank('u1');
  assert.equal(rank1.rank, 2);
});
