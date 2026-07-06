import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemReport() {
    const totalUsers = await this.prisma.user.count();
    const totalBattles = await this.prisma.battle.count();
    const activeBattles = await this.prisma.battle.count({ where: { status: 'ACTIVE' } });
    const totalChallenges = await this.prisma.challenge.count();
    const activeChallenges = await this.prisma.challenge.count({ where: { expiresAt: { gt: new Date() } } });

    return {
      systemStatus: 'Healthy',
      metrics: {
        totalUsers,
        totalBattles,
        activeBattles,
        totalChallenges,
        activeChallenges,
      },
      timestamp: new Date(),
    };
  }
}
