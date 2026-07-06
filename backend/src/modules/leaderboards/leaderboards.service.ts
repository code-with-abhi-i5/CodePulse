import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGlobalLeaderboard(limit: number = 100) {
    return this.prisma.developerRating.findMany({
      orderBy: { overall: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, avatar: true, name: true } },
      },
    });
  }

  async getLanguageLeaderboard(language: string, limit: number = 50) {
    return this.prisma.languageStat.findMany({
      where: { name: { equals: language, mode: 'insensitive' } },
      orderBy: { linesOfCode: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }
}
