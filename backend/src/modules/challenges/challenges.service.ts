import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ChallengeStatus, ChallengeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChallengeDto } from './dto/challenges.dto';
import { XpService } from '../xp/xp.service';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly xpService?: XpService,
  ) {}

  async getActiveChallenges() {
    return this.prisma.challenge.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async getUserChallenges(userId: string) {
    return this.prisma.userChallenge.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { challenge: { expiresAt: 'asc' } },
    });
  }

  async createChallenge(dto: CreateChallengeDto) {
    return this.prisma.challenge.create({
      data: {
        ...dto,
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }

  async processUserActivity(
    userId: string,
    category: string,
    count: number = 1,
  ) {
    const activeChallenges = await this.prisma.challenge.findMany({
      where: {
        category,
        expiresAt: { gt: new Date() },
      },
    });

    for (const challenge of activeChallenges) {
      const processSingle = async (tx: any) => {
        let userChallenge = await tx.userChallenge.findUnique({
          where: {
            userId_challengeId: {
              userId,
              challengeId: challenge.id,
            },
          },
        });

        if (!userChallenge) {
          userChallenge = await tx.userChallenge.create({
            data: {
              userId,
              challengeId: challenge.id,
              progress: 0,
              isCompleted: false,
              status: ChallengeStatus.IN_PROGRESS,
            },
          });
        }

        if (
          userChallenge.status === ChallengeStatus.COMPLETED ||
          userChallenge.status === ChallengeStatus.CLAIMED ||
          userChallenge.status === ChallengeStatus.EXPIRED ||
          userChallenge.isCompleted
        ) {
          return;
        }

        const newProgress = Math.min(
          userChallenge.progress + count,
          challenge.target,
        );
        const isCompleted = newProgress >= challenge.target;
        const newStatus = isCompleted
          ? ChallengeStatus.COMPLETED
          : ChallengeStatus.IN_PROGRESS;

        await tx.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            progress: newProgress,
            isCompleted,
            status: newStatus,
            completedAt: isCompleted ? new Date() : null,
          },
        });

        if (isCompleted) {
          await tx.notification.create({
            data: {
              userId,
              type: 'CHALLENGE',
              title: 'Challenge Completed! 🎉',
              message: `You completed the "${challenge.title}" challenge and earned ${challenge.xpReward} XP.`,
            },
          });

          await tx.activity.create({
            data: {
              userId,
              type: 'CHALLENGE',
              title: `Completed ${challenge.title}`,
              description: `Earned ${challenge.xpReward} XP for completing a challenge.`,
              metadata: { challengeId: challenge.id },
            },
          });

          if (this.xpService) {
            await this.xpService.addXp({
              userId,
              amount: challenge.xpReward,
              source: 'CHALLENGE_COMPLETE',
              reason: `Completed challenge: ${challenge.title}`,
            });
          } else {
            await tx.developerRating.updateMany({
              where: { userId },
              data: {
                gamificationXp: { increment: challenge.xpReward },
                xp: { increment: challenge.xpReward },
              },
            });
          }
        }
      };

      if (this.prisma.$transaction) {
        await this.prisma.$transaction(async (tx) => processSingle(tx));
      } else {
        await processSingle(this.prisma);
      }
    }
  }

  async claimChallengeReward(userId: string, challengeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const userChallenge = await tx.userChallenge.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId,
          },
        },
        include: { challenge: true },
      });

      if (!userChallenge) {
        throw new NotFoundException('User challenge record not found');
      }

      if (userChallenge.status === ChallengeStatus.CLAIMED) {
        throw new BadRequestException(
          'Challenge reward has already been claimed',
        );
      }

      if (
        userChallenge.status !== ChallengeStatus.COMPLETED &&
        !userChallenge.isCompleted
      ) {
        throw new BadRequestException(
          'Challenge must be completed before claiming reward',
        );
      }

      const updated = await tx.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          status: ChallengeStatus.CLAIMED,
          claimedAt: new Date(),
        },
      });

      const xpReward = userChallenge.challenge.xpReward;

      if (this.xpService) {
        await this.xpService.addXp({
          userId,
          amount: xpReward,
          source: 'CHALLENGE_CLAIM',
          reason: `Claimed reward for challenge: ${userChallenge.challenge.title}`,
        });
      } else {
        await tx.developerRating.updateMany({
          where: { userId },
          data: {
            xp: { increment: xpReward },
          },
        });
      }

      return {
        success: true,
        message: `Successfully claimed ${xpReward} XP for challenge: ${userChallenge.challenge.title}`,
        xpEarned: xpReward,
        userChallenge: updated,
      };
    });
  }

  calculateExpiration(type: ChallengeType, now = new Date()): Date {
    const expiresAt = new Date(now);

    switch (type) {
      case 'DAILY':
        expiresAt.setHours(23, 59, 59, 999);
        break;
      case 'WEEKLY': {
        const dayOfWeek = expiresAt.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        expiresAt.setDate(expiresAt.getDate() + daysUntilSunday);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      }
      case 'MONTHLY': {
        expiresAt.setMonth(expiresAt.getMonth() + 1, 0);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      }
      case 'SEASONAL': {
        expiresAt.setDate(expiresAt.getDate() + 30);
        expiresAt.setHours(23, 59, 59, 999);
        break;
      }
      default:
        expiresAt.setHours(23, 59, 59, 999);
    }

    return expiresAt;
  }

  async generateDailyChallenges(now = new Date()) {
    const templates = [
      {
        title: 'Daily Committer',
        description: 'Make 3 commits today',
        type: 'DAILY' as ChallengeType,
        difficulty: 'EASY' as any,
        xpReward: 50,
        target: 3,
        category: 'COMMITS',
        icon: 'Flame',
      },
      {
        title: 'Bug Squasher',
        description: 'Close 1 issue today',
        type: 'DAILY' as ChallengeType,
        difficulty: 'MEDIUM' as any,
        xpReward: 70,
        target: 1,
        category: 'ISSUES',
        icon: 'Target',
      },
      {
        title: 'Weekly Warrior',
        description: 'Make 15 commits this week',
        type: 'WEEKLY' as ChallengeType,
        difficulty: 'MEDIUM' as any,
        xpReward: 200,
        target: 15,
        category: 'COMMITS',
        icon: 'Calendar',
      },
      {
        title: 'Monthly Master',
        description: 'Earn 1000 stars this month',
        type: 'MONTHLY' as ChallengeType,
        difficulty: 'HARD' as any,
        xpReward: 1000,
        target: 1000,
        category: 'STARS',
        icon: 'Trophy',
      },
      {
        title: 'Winter Coder',
        description: 'Contribute for 30 days during winter season',
        type: 'SEASONAL' as ChallengeType,
        difficulty: 'LEGENDARY' as any,
        xpReward: 5000,
        target: 30,
        category: 'STREAK',
        icon: 'Sparkles',
      },
    ];

    let createdCount = 0;

    for (const template of templates) {
      const existing = await this.prisma.challenge.findFirst({
        where: {
          title: template.title,
          expiresAt: { gt: now },
        },
      });

      if (!existing) {
        const expiresAt = this.calculateExpiration(template.type, now);
        await this.prisma.challenge.create({
          data: {
            ...template,
            expiresAt,
          },
        });
        createdCount++;
      }
    }

    return { createdCount };
  }

  async archiveExpiredChallenges(now = new Date()) {
    const expiredUserChallenges = await this.prisma.userChallenge.updateMany({
      where: {
        status: ChallengeStatus.IN_PROGRESS,
        challenge: {
          expiresAt: { lte: now },
        },
      },
      data: {
        status: ChallengeStatus.EXPIRED,
      },
    });

    return {
      expiredUserChallengesCount: expiredUserChallenges.count,
    };
  }
}
