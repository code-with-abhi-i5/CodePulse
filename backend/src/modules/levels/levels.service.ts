import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAndLevelUp(userId: string) {
    const rating = await this.prisma.developerRating.findUnique({
      where: { userId },
    });

    if (!rating) {
      throw new NotFoundException(`Developer rating not found for user ${userId}`);
    }

    // Logic: if xp > xpToNextLevel, increase level and calculate new xpToNextLevel
    let { xp, level, xpToNextLevel } = rating;
    let leveledUp = false;

    while (xp >= xpToNextLevel) {
      level += 1;
      xp -= xpToNextLevel;
      xpToNextLevel = Math.floor(xpToNextLevel * 1.5); // Example scaling
      leveledUp = true;
    }

    if (leveledUp) {
      return this.prisma.developerRating.update({
        where: { userId },
        data: { level, xp, xpToNextLevel },
      });
    }

    return rating;
  }
}
