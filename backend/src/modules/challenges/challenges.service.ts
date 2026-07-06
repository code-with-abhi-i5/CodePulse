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
}
