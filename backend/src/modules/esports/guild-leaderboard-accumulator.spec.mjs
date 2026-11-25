import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class GuildLeaderboardAccumulatorService {
  aggregateGuildScores(guildId, memberScores) {
    const topScores = memberScores
      .map(m => m.score)
      .sort((a, b) => b - a)
      .slice(0, 5);
    const totalScore = topScores.reduce((acc, s) => acc + s, 0);
    return {
      guildId,
      totalScore,
      countedScores: topScores
    };
  }
}

describe('GuildLeaderboardAccumulatorService', () => {
  it('sums top 5 member scores to calculate weekly guild ranking', () => {
    const service = new GuildLeaderboardAccumulatorService();
    const scores = [
      { userId: 'u1', score: 100 },
      { userId: 'u2', score: 250 },
      { userId: 'u3', score: 80 },
      { userId: 'u4', score: 300 },
      { userId: 'u5', score: 150 },
      { userId: 'u6', score: 50 }, // 6th score should be ignored
      { userId: 'u7', score: 20 }
    ];

    const result = service.aggregateGuildScores('coders-united', scores);
    assert.strictEqual(result.countedScores.length, 5);
    assert.strictEqual(result.totalScore, 300 + 250 + 150 + 100 + 80);
  });
});
