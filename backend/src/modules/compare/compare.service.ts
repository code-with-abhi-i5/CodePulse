import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompareService {
  constructor(private readonly prisma: PrismaService) {}

  async compareDevelopers(username1: string, username2: string) {
    const [dev1, dev2] = await Promise.all([
      this.prisma.user.findUnique({ where: { username: username1 }, include: { stats: true, rating: true } }),
      this.prisma.user.findUnique({ where: { username: username2 }, include: { stats: true, rating: true } }),
    ]);

    if (!dev1) throw new NotFoundException(`User @${username1} not found`);
    if (!dev2) throw new NotFoundException(`User @${username2} not found`);

    return {
      developer1: {
        username: dev1.username,
        stats: dev1.stats,
        rating: dev1.rating,
      },
      developer2: {
        username: dev2.username,
        stats: dev2.stats,
        rating: dev2.rating,
      },
      comparison: {
        winner: (dev1.rating?.overall ?? 0) > (dev2.rating?.overall ?? 0) ? dev1.username : dev2.username,
        scoreDiff: Math.abs((dev1.rating?.overall ?? 0) - (dev2.rating?.overall ?? 0)),
      }
    };
  }
}
