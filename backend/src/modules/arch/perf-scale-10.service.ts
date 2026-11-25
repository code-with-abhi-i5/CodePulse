/**
 * Architecture Service: Redis Skip-List Leaderboard
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-10]
 */

export interface LeaderboardEntry {
  userId: string;
  score: number;
  updatedAt: number;
}

export class RedisSkipListLeaderboardService {
  private entries: Map<string, LeaderboardEntry>;

  constructor() {
    this.entries = new Map();
  }

  public zadd(userId: string, score: number, updatedAt: number = Date.now()): void {
    this.entries.set(userId, { userId, score, updatedAt });
  }

  public zrevrank(userId: string): number | null {
    if (!this.entries.has(userId)) return null;
    const sorted = this.getSorted();
    const rank = sorted.findIndex(e => e.userId === userId);
    return rank !== -1 ? rank : null; // 0-indexed rank
  }

  public zrevrange(start: number, stop: number): LeaderboardEntry[] {
    const sorted = this.getSorted();
    return sorted.slice(start, stop + 1);
  }

  private getSorted(): LeaderboardEntry[] {
    return Array.from(this.entries.values()).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.updatedAt - b.updatedAt; // Earlier submission wins tie
    });
  }
}
