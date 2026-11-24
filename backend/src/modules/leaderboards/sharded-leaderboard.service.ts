import { Injectable, Logger } from '@nestjs/common';
import { ZscoreNormalizerService } from './zscore-normalizer.service';

export interface LeaderboardRankEntry {
  userId: string;
  rank: number;
  score: number;
  zScore: number;
  percentile: number; // 0..100
  shardKey: string;
  updatedAt: Date;
}

export interface ShardDistributionSummary {
  shardKey: string;
  totalCompetitors: number;
  meanScore: number;
  stdDev: number;
  highestScore: number;
  lowestScore: number;
}

@Injectable()
export class ShardedLeaderboardService {
  private readonly logger = new Logger(ShardedLeaderboardService.name);

  // In-memory Redis Sorted Sets simulation: Map<shardKey, Map<userId, score>>
  private readonly shardedZSets = new Map<string, Map<string, number>>();

  constructor(private readonly zscoreNormalizer: ZscoreNormalizerService) {}

  public getShardKey(category: string, region = 'GLOBAL'): string {
    return `${category.toLowerCase()}:${region.toUpperCase()}`;
  }

  /**
   * Records/updates a competitor's score in the specified category and region shard.
   * Executes in < 2ms.
   */
  public async recordScore(
    category: string,
    region: string,
    userId: string,
    score: number,
  ): Promise<LeaderboardRankEntry> {
    const start = performance.now();
    const shardKey = this.getShardKey(category, region);

    if (!this.shardedZSets.has(shardKey)) {
      this.shardedZSets.set(shardKey, new Map<string, number>());
    }

    const zset = this.shardedZSets.get(shardKey)!;
    zset.set(userId, score);

    // Update streaming distribution
    this.zscoreNormalizer.updateDistribution(shardKey, score);

    // Compute rank, z-score and percentile
    const entry = this.getPlayerRank(category, region, userId)!;
    const duration = performance.now() - start;

    if (duration > 2.0) {
      this.logger.debug(`Score record latency: ${duration.toFixed(2)}ms (target < 2ms)`);
    }

    return entry;
  }

  /**
   * Retrieves player's rank, score, z-score, and percentile in < 2ms.
   */
  public getPlayerRank(category: string, region: string, userId: string): LeaderboardRankEntry | null {
    const shardKey = this.getShardKey(category, region);
    const zset = this.shardedZSets.get(shardKey);
    if (!zset || !zset.has(userId)) {
      return null;
    }

    const targetScore = zset.get(userId)!;

    // Rank calculation (number of players with higher score + 1)
    let higherCount = 0;
    for (const score of zset.values()) {
      if (score > targetScore) {
        higherCount++;
      }
    }
    const rank = higherCount + 1;

    const zScore = this.zscoreNormalizer.calculateZScore(shardKey, targetScore);
    const percentile = this.zscoreNormalizer.calculatePercentile(shardKey, targetScore);

    return {
      userId,
      rank,
      score: targetScore,
      zScore,
      percentile,
      shardKey,
      updatedAt: new Date(),
    };
  }

  /**
   * Retrieves top N players in a shard.
   */
  public getTopPlayers(
    category: string,
    region: string,
    limit = 50,
    offset = 0,
  ): LeaderboardRankEntry[] {
    const shardKey = this.getShardKey(category, region);
    const zset = this.shardedZSets.get(shardKey);
    if (!zset) return [];

    const sorted = Array.from(zset.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(offset, offset + limit);

    return sorted.map(([userId, score], index) => {
      const rank = offset + index + 1;
      const zScore = this.zscoreNormalizer.calculateZScore(shardKey, score);
      const percentile = this.zscoreNormalizer.calculatePercentile(shardKey, score);

      return {
        userId,
        rank,
        score,
        zScore,
        percentile,
        shardKey,
        updatedAt: new Date(),
      };
    });
  }

  /**
   * Returns statistical distribution summary for a shard.
   */
  public getShardDistribution(category: string, region: string): ShardDistributionSummary | null {
    const shardKey = this.getShardKey(category, region);
    const zset = this.shardedZSets.get(shardKey);
    if (!zset || zset.size === 0) return null;

    const stats = this.zscoreNormalizer.getDistribution(shardKey);
    const scores = Array.from(zset.values());

    return {
      shardKey,
      totalCompetitors: zset.size,
      meanScore: Number((stats?.mean ?? 0).toFixed(2)),
      stdDev: Number((stats?.stdDev ?? 0).toFixed(2)),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };
  }

  public clear(): void {
    this.shardedZSets.clear();
    this.zscoreNormalizer.clear();
  }
}
