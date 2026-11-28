import { LeaderboardRankResult } from '../../types/db';

export class LeaderboardRankingRecalculatorService {
  private scores: Map<string, number> = new Map();

  recordScore(userId: string, score: number): void {
    this.scores.set(userId, score);
  }

  calculateRank(userId: string): LeaderboardRankResult | null {
    const targetScore = this.scores.get(userId);
    if (targetScore === undefined) return null;

    const allScores = Array.from(this.scores.values()).sort((a, b) => b - a);
    const rank = allScores.indexOf(targetScore) + 1;
    const total = allScores.length;
    const percentile = total === 1 ? 100 : Math.round(((total - rank) / total) * 100);

    return {
      userId,
      score: targetScore,
      rank,
      totalParticipants: total,
      percentile
    };
  }
}
