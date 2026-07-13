import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChallengeDto } from './dto/challenges.dto';

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveChallenges() {
    return this.prisma.challenge.findMany({
      where: { expiresAt: { gt: new Date() } },
    });
  }

  async getUserChallenges(userId: string) {
    return this.prisma.userChallenge.findMany({
      where: { userId },
      include: { challenge: true },
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

  async processUserActivity(userId: string, category: string, count: number = 1) {
    const activeChallenges = await this.prisma.challenge.findMany({
      where: {
        category,
        expiresAt: { gt: new Date() },
      },
    });

    for (const challenge of activeChallenges) {
      let userChallenge = await this.prisma.userChallenge.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId: challenge.id,
          },
        },
      });

      if (!userChallenge) {
        userChallenge = await this.prisma.userChallenge.create({
          data: {
            userId,
            challengeId: challenge.id,
            progress: 0,
            isCompleted: false,
          },
        });
      }

      if (userChallenge.isCompleted) {
        continue;
      }

      const newProgress = Math.min(userChallenge.progress + count, challenge.target);
      const isCompleted = newProgress >= challenge.target;

      await this.prisma.userChallenge.update({
        where: { id: userChallenge.id },
        data: {
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      if (isCompleted) {
        await this.prisma.developerRating.updateMany({
          where: { userId },
          data: {
            xp: { increment: challenge.xpReward },
          },
        });

        await this.prisma.notification.create({
          data: {
            userId,
            type: 'CHALLENGE',
            title: 'Challenge Completed! 🎉',
            message: `You completed the "${challenge.title}" challenge and earned ${challenge.xpReward} XP.`,
          },
        });
      }
    }
  }

  async generateDailyChallenges() {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setHours(23, 59, 59, 999);
    
    const templates = [
      {
        title: 'Daily Committer',
        description: 'Make 3 commits today',
        type: 'DAILY' as any,
        difficulty: 'EASY' as any,
        xpReward: 50,
        target: 3,
        category: 'COMMITS',
        icon: 'Flame'
      },
      {
        title: 'Bug Squasher',
        description: 'Close 1 issue today',
        type: 'DAILY' as any,
        difficulty: 'MEDIUM' as any,
        xpReward: 70,
        target: 1,
        category: 'ISSUES',
        icon: 'Target'
      },
      {
        title: 'Weekly Warrior',
        description: 'Make 15 commits this week',
        type: 'WEEKLY' as any,
        difficulty: 'MEDIUM' as any,
        xpReward: 200,
        target: 15,
        category: 'COMMITS',
        icon: 'Calendar'
      },
      {
        title: 'Monthly Master',
        description: 'Earn 1000 stars this month',
        type: 'MONTHLY' as any,
        difficulty: 'HARD' as any,
        xpReward: 1000,
        target: 1000,
        category: 'STARS',
        icon: 'Trophy'
      },
      {
        title: 'Winter Coder',
        description: 'Contribute for 30 days during winter season',
        type: 'SEASONAL' as any,
        difficulty: 'LEGENDARY' as any,
        xpReward: 5000,
        target: 30,
        category: 'STREAK',
        icon: 'Sparkles'
      }
    ];

    for (const template of templates) {
      await this.prisma.challenge.create({
        data: {
          ...template,
          expiresAt
        }
      });
    }
  }
}
