import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../prisma/prisma.service';
import { RedisZsetProjectorService } from '../projectors/redis-zset-projector.service';
import {
  DriftEntry,
  ReconciliationAuditReport,
} from './leaderboard-reconciler.types';

@Injectable()
export class LeaderboardReconcilerService {
  private readonly logger = new Logger(LeaderboardReconcilerService.name);
  private lastAuditReport: ReconciliationAuditReport | null = null;
  private readonly auditHistory: ReconciliationAuditReport[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisProjector: RedisZsetProjectorService,
  ) {}

  /**
   * Self-healing reconciler: hourly cron comparing write-master state with read projections to repair drift.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyReconciliation(): Promise<ReconciliationAuditReport> {
    this.logger.log('Triggering automated hourly leaderboard reconciliation cron...');
    return this.reconcileLeaderboards();
  }

  /**
   * Core reconciliation execution:
   * 1. Fetches canonical ground truth from PostgreSQL write-master.
   * 2. Reads projected read models from Redis Sorted Sets.
   * 3. Calculates drift (missing members, score delta, orphaned keys).
   * 4. Self-heals by rewriting canonical state into Redis ZSETs.
   */
  async reconcileLeaderboards(): Promise<ReconciliationAuditReport> {
    const startTime = performance.now();
    const reconciliationId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();
    const driftEntries: DriftEntry[] = [];
    let repairedCount = 0;

    this.logger.log(`[Reconciler ${reconciliationId}] Starting write-master vs read-model reconciliation`);

    const globalRatingKey = this.redisProjector.getGlobalRatingKey();
    const globalCommitsKey = this.redisProjector.getGlobalCommitsKey();

    try {
      // 1. Read Canonical Ground Truth from PostgreSQL Write-Master
      const postgresUsersMap = new Map<
        string,
        { score: number; commits: number; country?: string; username: string; name?: string }
      >();

      // A. Query DeveloperRating & DeveloperStats if available
      try {
        const ratings = await this.prisma.developerRating.findMany({
          take: 1000,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                location: true,
                avatar: true,
                stats: { select: { totalCommits: true } },
              },
            },
          },
        });

        for (const r of ratings) {
          if (r.user) {
            postgresUsersMap.set(r.user.id, {
              score: r.overall,
              commits: r.user.stats?.totalCommits || 0,
              country: r.user.location || undefined,
              username: r.user.username,
              name: r.user.name || undefined,
            });
          }
        }
      } catch (err: any) {
        this.logger.debug(`DeveloperRating query in reconciler: ${err.message}`);
      }

      // B. Query GithubUser table
      try {
        const ghUsers = await this.prisma.githubUser.findMany({
          take: 1000,
          select: {
            id: true,
            username: true,
            name: true,
            score: true,
            country: true,
            avatarUrl: true,
            publicRepos: true,
          },
        });

        for (const gu of ghUsers) {
          const existing = postgresUsersMap.get(gu.id);
          if (!existing) {
            postgresUsersMap.set(gu.id, {
              score: gu.score,
              commits: gu.publicRepos * 10,
              country: gu.country || undefined,
              username: gu.username,
              name: gu.name || undefined,
            });
          }
        }
      } catch (err: any) {
        this.logger.debug(`GithubUser query in reconciler: ${err.message}`);
      }

      // 2. Read Current Projected Read Model from Redis ZSETs
      const [redisRatingMap, redisCommitsMap] = await Promise.all([
        this.redisProjector.getAllMembersWithScores(globalRatingKey),
        this.redisProjector.getAllMembersWithScores(globalCommitsKey),
      ]);

      const totalPostgresRecords = postgresUsersMap.size;
      const totalRedisRecords = Math.max(redisRatingMap.size, redisCommitsMap.size);

      // 3. Compare Ground Truth with Projected Read Model
      for (const [userId, pgData] of postgresUsersMap.entries()) {
        const redisScore = redisRatingMap.get(userId);

        // Check Rating Drift
        if (redisScore === undefined) {
          // Missing in Redis
          driftEntries.push({
            userId,
            metric: 'rating',
            postgresScore: pgData.score,
            redisScore: null,
            driftDelta: pgData.score,
            reason: 'MISSING_IN_REDIS',
            repairedAt: new Date().toISOString(),
          });

          // Self-heal: ZADD into Redis ZSET
          await this.redisProjector.zAdd(globalRatingKey, pgData.score, userId);
          if (pgData.country) {
            const countryKey = this.redisProjector.getCountryRatingKey(pgData.country);
            await this.redisProjector.zAdd(countryKey, pgData.score, userId);
          }
          await this.redisProjector.setUserMetadata(userId, {
            username: pgData.username,
            name: pgData.name,
            country: pgData.country,
          });
          repairedCount++;
        } else if (Math.abs(redisScore - pgData.score) > 0.001) {
          // Score Drift Detected
          const driftDelta = pgData.score - redisScore;
          driftEntries.push({
            userId,
            metric: 'rating',
            postgresScore: pgData.score,
            redisScore,
            driftDelta,
            reason: 'SCORE_DRIFT',
            repairedAt: new Date().toISOString(),
          });

          // Self-heal: Align Redis ZSET with Postgres Write-Master
          await this.redisProjector.zAdd(globalRatingKey, pgData.score, userId);
          if (pgData.country) {
            const countryKey = this.redisProjector.getCountryRatingKey(pgData.country);
            await this.redisProjector.zAdd(countryKey, pgData.score, userId);
          }
          repairedCount++;
        }

        // Check Commits Drift
        const redisCommits = redisCommitsMap.get(userId);
        if (redisCommits === undefined || Math.abs(redisCommits - pgData.commits) > 0) {
          await this.redisProjector.zAdd(globalCommitsKey, pgData.commits, userId);
          if (pgData.country) {
            const countryCommitsKey = this.redisProjector.getCountryCommitsKey(pgData.country);
            await this.redisProjector.zAdd(countryCommitsKey, pgData.commits, userId);
          }
        }
      }

      // Check for Orphaned entries in Redis (members in Redis that do not exist in Postgres)
      for (const [member, rScore] of redisRatingMap.entries()) {
        if (!postgresUsersMap.has(member) && postgresUsersMap.size > 0) {
          driftEntries.push({
            userId: member,
            metric: 'rating',
            postgresScore: 0,
            redisScore: rScore,
            driftDelta: -rScore,
            reason: 'ORPHAN_IN_REDIS',
            repairedAt: new Date().toISOString(),
          });

          // Self-heal: purge orphan from Redis ZSET
          await this.redisProjector.zRem(globalRatingKey, member);
          repairedCount++;
        }
      }

      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const completedAt = new Date().toISOString();

      const report: ReconciliationAuditReport = {
        reconciliationId,
        startedAt,
        completedAt,
        durationMs,
        totalPostgresRecords,
        totalRedisRecords,
        driftsFound: driftEntries.length,
        repairedCount,
        details: driftEntries,
        status: driftEntries.length > 0 ? 'DRIFT_REPAIRED' : 'IN_SYNC',
      };

      this.lastAuditReport = report;
      this.auditHistory.unshift(report);
      if (this.auditHistory.length > 50) {
        this.auditHistory.pop();
      }

      this.logger.log(
        `[Reconciler ${reconciliationId}] Finished in ${durationMs}ms: Checked ${totalPostgresRecords} PG records, ${totalRedisRecords} Redis records. Drifts: ${driftEntries.length}, Repaired: ${repairedCount}. Status: ${report.status}`,
      );

      return report;
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const failedReport: ReconciliationAuditReport = {
        reconciliationId,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs,
        totalPostgresRecords: 0,
        totalRedisRecords: 0,
        driftsFound: driftEntries.length,
        repairedCount,
        details: driftEntries,
        status: 'FAILED',
      };
      this.lastAuditReport = failedReport;
      this.logger.error(`Reconciliation failed: ${err.message}`, err.stack);
      return failedReport;
    }
  }

  getLatestAuditReport(): ReconciliationAuditReport | null {
    return this.lastAuditReport;
  }

  getAuditHistory(): ReconciliationAuditReport[] {
    return [...this.auditHistory];
  }
}
