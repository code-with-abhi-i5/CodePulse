import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformStats() {
    // Mock implementation for platform stats
    return {
      activeDevelopers: 250000,
      commitsAnalyzed: 12000000,
      battlesFought: 500000,
      uptime: '99.9%',
    };
  }

  async getUserAnalytics(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { stats: true, languages: true },
    });

    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    return {
      stats: user.stats,
      languages: user.languages,
      // More aggregated data can be added here (e.g. contribution heatmap data)
    };
  }
}
