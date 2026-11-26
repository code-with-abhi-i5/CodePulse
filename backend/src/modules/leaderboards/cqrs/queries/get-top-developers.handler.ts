import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler } from '../core/cqrs.decorators';
import { IQueryHandler } from '../core/cqrs.types';
import { GetTopDevelopersQuery } from './get-top-developers.query';
import { RedisZsetProjectorService } from '../projectors/redis-zset-projector.service';
import { PaginatedLeaderboardResult, LeaderboardRankItem } from '../projectors/read-model.types';

@Injectable()
@QueryHandler(GetTopDevelopersQuery)
export class GetTopDevelopersQueryHandler
  implements IQueryHandler<GetTopDevelopersQuery, PaginatedLeaderboardResult>
{
  private readonly logger = new Logger(GetTopDevelopersQueryHandler.name);

  constructor(private readonly redisProjector: RedisZsetProjectorService) {}

  async execute(query: GetTopDevelopersQuery): Promise<PaginatedLeaderboardResult> {
    const startTime = performance.now();
    const { limit = 20, offset = 0, metric = 'rating' } = query;

    const zsetKey =
      metric === 'commits'
        ? this.redisProjector.getGlobalCommitsKey()
        : this.redisProjector.getGlobalRatingKey();

    // Read exclusively from Redis Sorted Set Read Model (No PostgreSQL access!)
    const [rawEntries, total] = await Promise.all([
      this.redisProjector.zRevRangeWithScores(zsetKey, offset, limit),
      this.redisProjector.zCard(zsetKey),
    ]);

    // Fast in-memory decoration with cached metadata
    const data: LeaderboardRankItem[] = await Promise.all(
      rawEntries.map(async (entry) => {
        const metadata = await this.redisProjector.getUserMetadata(entry.member);
        return {
          rank: entry.rank,
          userId: entry.member,
          username: metadata?.username || `dev_${entry.member.substring(0, 8)}`,
          name: metadata?.name,
          avatarUrl: metadata?.avatarUrl || `https://avatars.githubusercontent.com/u/${entry.member}`,
          country: metadata?.country,
          score: entry.score,
        };
      }),
    );

    const latencyMs = parseFloat((performance.now() - startTime).toFixed(3));

    if (latencyMs > 5) {
      this.logger.warn(`Query execution time exceeded 5ms SLA: ${latencyMs}ms`);
    } else {
      this.logger.debug(`GetTopDevelopersQuery served from Redis ZSET in ${latencyMs}ms`);
    }

    return {
      data,
      total,
      limit,
      offset,
      metric,
      latencyMs,
      source: 'redis_zset_read_model',
    };
  }
}
