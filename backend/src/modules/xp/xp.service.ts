import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddXpDto } from './dto/xp.dto';

@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  async addXp(dto: AddXpDto) {
    const rating = await this.prisma.developerRating.findUnique({
      where: { userId: dto.userId },
    });

    if (!rating) {
      throw new NotFoundException(`Developer rating not found for user ${dto.userId}`);
    }

    const newXp = rating.xp + dto.amount;
    
    // In a real implementation, we would check if newXp > xpToNextLevel
    // and trigger the LevelUp logic from the Levels module

    return this.prisma.developerRating.update({
      where: { userId: dto.userId },
      data: { xp: newXp },
    });
  }
}
