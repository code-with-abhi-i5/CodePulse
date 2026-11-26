import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';

export interface FastRefreshTriggerPayload {
  matchId: string;
  winnerId: string;
  loserId: string;
  isHighStakes?: boolean;
  matchType?: string;
  winnerRank?: number;
  loserRank?: number;
}

export interface RefreshResult {
  success: boolean;
  triggeredBy: 'cron' | 'event_top10' | 'event_high_stakes' | 'manual';
  durationMs: number;
  timestamp: string;
  concurrent: boolean;
  error?: string;
}

@Injectable()
export class MaterializedViewRefreshService {
  private readonly logger = new Logger(MaterializedViewRefreshService.name);

  // Concurrency guard to prevent parallel REFRESH MATERIALIZED VIEW statements
  private isRefreshing = false;
  private queuedRefresh: FastRefreshTriggerPayload | null = null;
  private lastRefreshTime = 0;
  private readonly DEBOUNCE_COOLDOWN_MS = 3000; // 3 seconds minimum between refreshes

  private lastRefreshResult: RefreshResult | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager?: Cache,
  ) {}

  /**
   * Evaluates match completion: triggers fast concurrent refresh if either player
   * is in the Top 10 or the match is designated as high-stakes.
   */
  async triggerFastRefreshIfTopPlayer(
    payload: FastRefreshTriggerPayload,
  ): Promise<boolean> {
    const { matchId, winnerId, loserId, isHighStakes, matchType, winnerRank, loserRank } = payload;

    const isDesignatedHighStakes =
      Boolean(isHighStakes) ||
      matchType === 'HIGH_STAKES' ||
      matchType === 'TOURNAMENT_FINAL' ||
      matchType?.includes('HIGH_STAKES');

    let shouldTrigger = Boolean(isDesignatedHighStakes);
    let triggerReason: 'event_top10' | 'event_high_stakes' = isDesignatedHighStakes
      ? 'event_high_stakes'
      : 'event_top10';

    // Check if winner or loser is in top 10 if not already marked as high-stakes
    if (!shouldTrigger) {
      if (
        (winnerRank !== undefined && winnerRank <= 10) ||
        (loserRank !== undefined && loserRank <= 10)
      ) {
        shouldTrigger = true;
      } else {
        // Query current rank of winner and loser from mv_leaderboard_global
        try {
          const topPlayers = await this.prisma.$queryRaw<Array<{ user_id: string; rank: number }>>`
            SELECT user_id, rank
            FROM mv_leaderboard_global
            WHERE user_id IN (${winnerId}, ${loserId}) AND rank <= 10
            LIMIT 2;
          `;

          if (topPlayers && topPlayers.length > 0) {
            shouldTrigger = true;
            this.logger.log(
              `Top 10 player detected in match ${matchId} (User: ${topPlayers[0].user_id}, Rank: #${topPlayers[0].rank}). Initiating fast refresh.`,
            );
          }
        } catch {
          // Fallback check against developer_ratings if view not yet populated
          try {
            const topRatings = await this.prisma.developerRating.findMany({
              where: {
                userId: { in: [winnerId, loserId] },
                rank: { lte: 10, gt: 0 },
              },
              take: 2,
            });

            if (topRatings.length > 0) {
              shouldTrigger = true;
            }
          } catch {
            // Ignore during DB initialization
          }
        }
      }
    }

    if (!shouldTrigger) {
      this.logger.debug(
        `Match ${matchId} completed by non-top-10 participants. Awaiting scheduled pg_cron 5m refresh.`,
      );
      return false;
    }

    this.logger.log(
      `Fast refresh condition met (${triggerReason}) for match ${matchId}. Triggering concurrent refresh...`,
    );

    // Run refresh asynchronously with debounce & queueing
    this.scheduleDebouncedRefresh(triggerReason);
    return true;
  }

  /**
   * Schedules a debounced refresh, coalescing rapid successive requests.
   */
  private scheduleDebouncedRefresh(
    triggeredBy: 'event_top10' | 'event_high_stakes' | 'manual',
  ): void {
    const now = Date.now();
    const timeSinceLast = now - this.lastRefreshTime;

    if (this.isRefreshing) {
      this.logger.log('Concurrent refresh currently active; queueing refresh request.');
      this.queuedRefresh = { matchId: 'queued', winnerId: '', loserId: '', isHighStakes: true };
      return;
    }

    if (timeSinceLast < this.DEBOUNCE_COOLDOWN_MS) {
      const waitMs = this.DEBOUNCE_COOLDOWN_MS - timeSinceLast;
      this.logger.debug(`Debouncing fast refresh (waiting ${waitMs}ms)...`);
      setTimeout(() => {
        this.executeConcurrentRefresh(triggeredBy).catch((err) => {
          this.logger.error(`Debounced refresh error: ${err.message}`);
        });
      }, waitMs);
      return;
    }

    this.executeConcurrentRefresh(triggeredBy).catch((err) => {
      this.logger.error(`Fast refresh error: ${err.message}`);
    });
  }

  /**
   * Executes REFRESH MATERIALIZED VIEW CONCURRENTLY against PostgreSQL.
   */
  async executeConcurrentRefresh(
    triggeredBy: 'cron' | 'event_top10' | 'event_high_stakes' | 'manual' = 'manual',
  ): Promise<RefreshResult> {
    if (this.isRefreshing) {
      return {
        success: false,
        triggeredBy,
        durationMs: 0,
        timestamp: new Date().toISOString(),
        concurrent: true,
        error: 'A materialized view refresh is already in progress',
      };
    }

    this.isRefreshing = true;
    const start = performance.now();
    let isConcurrent = true;

    try {
      this.logger.log(
        `[Materialized View Invalidation Engine] Executing REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global...`,
      );

      try {
        await this.prisma.$executeRawUnsafe(
          'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_global;',
        );
      } catch (concurrentErr: any) {
        // If concurrent refresh fails (e.g. view not populated yet or unique index missing), fallback to non-concurrent
        this.logger.warn(
          `Concurrent refresh failed (${concurrentErr.message}). Falling back to standard non-concurrent refresh...`,
        );
        isConcurrent = false;
        await this.prisma.$executeRawUnsafe(
          'REFRESH MATERIALIZED VIEW mv_leaderboard_global;',
        );
      }

      const durationMs = parseFloat((performance.now() - start).toFixed(2));
      this.lastRefreshTime = Date.now();

      const result: RefreshResult = {
        success: true,
        triggeredBy,
        durationMs,
        timestamp: new Date().toISOString(),
        concurrent: isConcurrent,
      };

      this.lastRefreshResult = result;
      this.logger.log(
        `[Materialized View Invalidation Engine] Refresh completed successfully in ${durationMs}ms (concurrent: ${isConcurrent}, trigger: ${triggeredBy}).`,
      );

      // Invalidate relevant cache keys in cacheManager
      if (this.cacheManager) {
        try {
          await Promise.all([
            this.cacheManager.del('leaderboard:global:first:20'),
            this.cacheManager.del('leaderboard:india:first:20'),
          ]);
        } catch {
          // ignore cache deletion failure
        }
      }

      // Check queued requests
      if (this.queuedRefresh) {
        this.queuedRefresh = null;
        setTimeout(() => {
          this.executeConcurrentRefresh('event_top10').catch(() => {});
        }, this.DEBOUNCE_COOLDOWN_MS);
      }

      return result;
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2));
      this.logger.error(`Failed to refresh materialized view: ${err.message}`, err.stack);

      const failedResult: RefreshResult = {
        success: false,
        triggeredBy,
        durationMs,
        timestamp: new Date().toISOString(),
        concurrent: isConcurrent,
        error: err.message,
      };
      this.lastRefreshResult = failedResult;
      return failedResult;
    } finally {
      this.isRefreshing = false;
    }
  }

  getLastRefreshResult(): RefreshResult | null {
    return this.lastRefreshResult;
  }
}
