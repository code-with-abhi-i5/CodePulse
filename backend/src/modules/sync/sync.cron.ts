import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueManagerService } from '../queues/queue-manager.service';

@Injectable()
export class SyncCronService {
  private readonly logger = new Logger(SyncCronService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('github-sync') private readonly queue: Queue,
    @Optional() private readonly queueManager?: QueueManagerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyContributionSync() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const now = new Date();
      const users = await this.prisma.user.findMany({
        where: {
          updatedAt: { gte: new Date(now.getTime() - 30 * 86400000) },
          deletedAt: null,
        },
        select: { id: true },
        take: 200,
        orderBy: { id: 'asc' },
      });

      // Identify active battle competitors for priority routing (#372)
      const activeCompetitorIds = new Set<string>();
      if (this.prisma && (this.prisma as any).battle?.findMany) {
        try {
          const activeBattles = await (this.prisma as any).battle.findMany({
            where: { status: 'ACTIVE' },
            select: { challengerId: true, opponentId: true },
          });
          for (const b of activeBattles || []) {
            if (b.challengerId) activeCompetitorIds.add(b.challengerId);
            if (b.opponentId) activeCompetitorIds.add(b.opponentId);
          }
        } catch {
          // Fallback if battle table is mocked or unavailable
        }
      }

      for (const user of users) {
        const jobId = `daily-${now.toISOString().slice(0, 10)}-${user.id}`;
        const isCompetitor = activeCompetitorIds.has(user.id);

        if (this.queueManager) {
          // Route through sharded queues: priority (0ms delay) vs bulk (rate-limited) (#372)
          await this.queueManager.routeSyncJob({
            userId: user.id,
            isPriority: isCompetitor,
            jobId,
          });
        } else {
          // Fallback to legacy single queue
          await this.queue.add(
            'sync-user',
            { userId: user.id },
            { jobId },
          );
        }
      }

      this.logger.log(
        `Scheduled ${users.length} user sync jobs across sharded queues; priority competitors: ${activeCompetitorIds.size}.`,
      );
    } catch {
      this.logger.error(
        'Could not enqueue the complete daily sync batch; existing jobs are retained.',
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Immediate on-demand synchronization for active battle competitors with 0ms delay (#372).
   */
  async triggerCompetitorPrioritySync(userId: string) {
    if (this.queueManager) {
      return this.queueManager.routeSyncJob({
        userId,
        isPriority: true,
        overrideDelayMs: 0,
      });
    }

    return this.queue.add(
      'sync-user',
      { userId, priority: true },
      { priority: 1, delay: 0 },
    );
  }
}
