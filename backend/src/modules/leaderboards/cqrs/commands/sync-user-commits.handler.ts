import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler } from '../core/cqrs.decorators';
import { ICommandHandler } from '../core/cqrs.types';
import { SyncUserCommitsCommand } from './sync-user-commits.command';
import { UserCommitsSyncedEvent } from '../events/user-commits-synced.event';
import { EventBus } from '../core/event-bus';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface SyncUserCommitsResult {
  success: boolean;
  userId: string;
  addedCommits: number;
  totalCommits: number;
  updatedScore: number;
  country?: string;
  timestamp: string;
}

@Injectable()
@CommandHandler(SyncUserCommitsCommand)
export class SyncUserCommitsCommandHandler
  implements ICommandHandler<SyncUserCommitsCommand, SyncUserCommitsResult>
{
  private readonly logger = new Logger(SyncUserCommitsCommandHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SyncUserCommitsCommand): Promise<SyncUserCommitsResult> {
    const { userId, newCommitsCount, linesAdded = 0, repositoryName, country } = command;

    this.logger.log(
      `Executing SyncUserCommitsCommand for user ${userId} (+${newCommitsCount} commits)`,
    );

    let totalCommits = newCommitsCount;
    let updatedScore = 0;
    let detectedCountry: string | undefined = country;

    // PostgreSQL write-master transactional integrity
    await this.prisma.$transaction(async (tx) => {
      // 1. Update DeveloperStats table
      try {
        const stats = await tx.developerStats.upsert({
          where: { userId },
          create: {
            userId,
            totalCommits: newCommitsCount,
            contributions: newCommitsCount,
          },
          update: {
            totalCommits: { increment: newCommitsCount },
            contributions: { increment: newCommitsCount },
          },
        });
        totalCommits = stats.totalCommits;
      } catch {
        totalCommits = newCommitsCount;
      }

      // 2. Calculate score contribution (10 points per commit)
      const scoreGain = newCommitsCount * 10;

      // 3. Update DeveloperRating table
      try {
        const rating = await tx.developerRating.upsert({
          where: { userId },
          create: {
            userId,
            overall: scoreGain,
            githubXp: scoreGain,
            xp: scoreGain,
          },
          update: {
            overall: { increment: scoreGain },
            githubXp: { increment: scoreGain },
            xp: { increment: scoreGain },
          },
        });
        updatedScore = rating.overall;
      } catch {
        // Fallback for GithubUser table
        try {
          const ghUser = await tx.githubUser.findUnique({ where: { id: userId } })
            || await tx.githubUser.findFirst({ where: { username: userId } });
          if (ghUser) {
            const updatedGh = await tx.githubUser.update({
              where: { id: ghUser.id },
              data: {
                score: { increment: scoreGain },
                ...(country ? { country } : {}),
              },
            });
            updatedScore = updatedGh.score;
            detectedCountry = updatedGh.country || detectedCountry;
          } else {
            updatedScore = scoreGain;
          }
        } catch {
          updatedScore = scoreGain;
        }
      }

      // 4. Update country on User profile if provided
      if (country) {
        try {
          await tx.user.update({
            where: { id: userId },
            data: { location: country },
          });
          detectedCountry = country;
        } catch {
          // ignore if user not found in User table
        }
      } else if (!detectedCountry) {
        try {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { location: true },
          });
          detectedCountry = user?.location || undefined;
        } catch {
          // ignore
        }
      }
    });

    const timestamp = new Date();

    // 5. Asynchronously project commit updates to Redis Sorted Sets
    const event = new UserCommitsSyncedEvent(
      userId,
      newCommitsCount,
      totalCommits,
      updatedScore,
      detectedCountry,
      timestamp,
    );

    this.eventBus.publish(event).catch((err) => {
      this.logger.error(`Failed to publish UserCommitsSyncedEvent: ${err.message}`, err.stack);
    });

    return {
      success: true,
      userId,
      addedCommits: newCommitsCount,
      totalCommits,
      updatedScore,
      country: detectedCountry,
      timestamp: timestamp.toISOString(),
    };
  }
}
