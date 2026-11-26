import { Injectable, Logger, Optional } from '@nestjs/common';
import { RedisService } from '../../../../common/redis/redis.service';
import { LeaderboardRankItem, UserReadMetadata } from './read-model.types';

@Injectable()
export class RedisZsetProjectorService {
  private readonly logger = new Logger(RedisZsetProjectorService.name);

  // In-memory Redis ZSET simulation stores for fallback & ultra-fast local operations
  private readonly memoryZsets = new Map<string, Map<string, number>>();
  private readonly memoryUserMetadata = new Map<string, UserReadMetadata>();

  constructor(@Optional() private readonly redisService?: RedisService) {}

  public getGlobalRatingKey(): string {
    return 'leaderboard:global:rating';
  }

  public getGlobalCommitsKey(): string {
    return 'leaderboard:global:commits';
  }

  public getCountryRatingKey(country: string): string {
    const normalized = country.trim().toLowerCase().replace(/\s+/g, '_');
    return `leaderboard:country:${normalized}:rating`;
  }

  public getCountryCommitsKey(country: string): string {
    const normalized = country.trim().toLowerCase().replace(/\s+/g, '_');
    return `leaderboard:country:${normalized}:commits`;
  }

  /**
   * ZADD: Atomic update or insert into Redis Sorted Set
   */
  async zAdd(key: string, score: number, member: string): Promise<void> {
    // 1. Try real Redis if available
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          await client.zadd(key, score, member);
        }
      } catch (err: any) {
        this.logger.debug(`Redis zadd fallback: ${err.message}`);
      }
    }

    // 2. Always keep in-memory projection in sync
    let zset = this.memoryZsets.get(key);
    if (!zset) {
      zset = new Map<string, number>();
      this.memoryZsets.set(key, zset);
    }
    zset.set(member, score);
  }

  /**
   * ZREVRANGE: Retrieves top members ordered from highest score to lowest.
   * Returns paginated rankings with rank and score in sub-millisecond execution.
   */
  async zRevRangeWithScores(
    key: string,
    offset = 0,
    limit = 20,
  ): Promise<Array<{ member: string; score: number; rank: number }>> {
    // 1. Try real Redis
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          // ZREVRANGE key start stop WITHSCORES
          const stop = offset + limit - 1;
          const raw = await client.zrevrange(key, offset, stop, 'WITHSCORES');
          const results: Array<{ member: string; score: number; rank: number }> = [];

          for (let i = 0; i < raw.length; i += 2) {
            results.push({
              member: raw[i],
              score: parseFloat(raw[i + 1]),
              rank: offset + Math.floor(i / 2) + 1,
            });
          }
          if (results.length > 0) return results;
        }
      } catch (err: any) {
        this.logger.debug(`Redis zrevrange fallback: ${err.message}`);
      }
    }

    // 2. In-memory sorted set retrieval
    const zset = this.memoryZsets.get(key);
    if (!zset || zset.size === 0) {
      return [];
    }

    const sorted = Array.from(zset.entries()).sort((a, b) => b[1] - a[1]);
    const sliced = sorted.slice(offset, offset + limit);

    return sliced.map(([member, score], idx) => ({
      member,
      score,
      rank: offset + idx + 1,
    }));
  }

  /**
   * ZREVRANK: O(log N) Rank retrieval (1-based rank).
   */
  async zRevRank(key: string, member: string): Promise<number | null> {
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          const rank = await client.zrevrank(key, member);
          if (rank !== null && rank !== undefined) {
            return rank + 1; // 1-indexed
          }
        }
      } catch (err: any) {
        this.logger.debug(`Redis zrevrank fallback: ${err.message}`);
      }
    }

    const zset = this.memoryZsets.get(key);
    if (!zset || !zset.has(member)) return null;

    const sorted = Array.from(zset.entries()).sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([m]) => m === member);
    return index === -1 ? null : index + 1;
  }

  /**
   * ZSCORE: Retrieves individual member score.
   */
  async zScore(key: string, member: string): Promise<number | null> {
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          const score = await client.zscore(key, member);
          if (score !== null && score !== undefined) {
            return parseFloat(score);
          }
        }
      } catch (err: any) {
        this.logger.debug(`Redis zscore fallback: ${err.message}`);
      }
    }

    const zset = this.memoryZsets.get(key);
    if (!zset) return null;
    const score = zset.get(member);
    return score !== undefined ? score : null;
  }

  /**
   * ZCARD: Returns total cardinality.
   */
  async zCard(key: string): Promise<number> {
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          return await client.zcard(key);
        }
      } catch (err: any) {
        this.logger.debug(`Redis zcard fallback: ${err.message}`);
      }
    }

    return this.memoryZsets.get(key)?.size || 0;
  }

  /**
   * ZREM: Removes member from set.
   */
  async zRem(key: string, member: string): Promise<void> {
    if (this.redisService) {
      try {
        const client = this.redisService.getClient?.();
        if (client && client.status === 'ready') {
          await client.zrem(key, member);
        }
      } catch (err: any) {
        this.logger.debug(`Redis zrem fallback: ${err.message}`);
      }
    }

    this.memoryZsets.get(key)?.delete(member);
  }

  /**
   * Stores user profile metadata snippet for zero-DB read decoration.
   */
  async setUserMetadata(userId: string, metadata: Partial<UserReadMetadata>): Promise<void> {
    const existing = this.memoryUserMetadata.get(userId) || {
      userId,
      username: metadata.username || userId,
    };

    const updated: UserReadMetadata = {
      ...existing,
      ...metadata,
      updatedAt: new Date().toISOString(),
    };

    this.memoryUserMetadata.set(userId, updated);
  }

  async getUserMetadata(userId: string): Promise<UserReadMetadata | null> {
    return this.memoryUserMetadata.get(userId) || null;
  }

  /**
   * Returns all members and scores in a ZSET (used by Reconciler)
   */
  async getAllMembersWithScores(key: string): Promise<Map<string, number>> {
    const zset = this.memoryZsets.get(key);
    if (!zset) {
      return new Map();
    }
    return new Map(zset);
  }

  /**
   * Clears in-memory projections (for test isolation)
   */
  clear(): void {
    this.memoryZsets.clear();
    this.memoryUserMetadata.clear();
  }
}
