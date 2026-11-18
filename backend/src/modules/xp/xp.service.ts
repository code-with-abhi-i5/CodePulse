import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddXpDto } from './dto/xp.dto';
import { LevelsService } from '../levels/levels.service';

@Injectable()
export class XpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levels: LevelsService,
  ) {}

  async addXp(dto: AddXpDto, transaction?: Prisma.TransactionClient) {
    if (
      !Number.isInteger(dto.amount) ||
      dto.amount <= 0 ||
      dto.amount > 2147483647 ||
      typeof dto.reason !== 'string' ||
      !dto.reason.trim() ||
      dto.reason.length > 500 ||
      (dto.source !== undefined &&
        (typeof dto.source !== 'string' ||
          !dto.source.trim() ||
          dto.source.length > 64))
    ) {
      throw new BadRequestException(
        'XP requires a positive integer amount, a reason and a valid source',
      );
    }

    const runWithTx = async (tx: Prisma.TransactionClient) => {
      // All award and standalone level-check paths acquire this same row lock.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${dto.userId} FOR UPDATE`;
      const rating = await tx.developerRating.findUnique({
        where: { userId: dto.userId },
      });
      if (!rating)
        throw new NotFoundException(
          `Developer rating not found for user ${dto.userId}`,
        );
      if (
        !Number.isSafeInteger(rating.xp + dto.amount) ||
        rating.xp + dto.amount > 2147483647
      ) {
        throw new BadRequestException('XP total exceeds the supported range');
      }

      const source = dto.source?.trim() || 'MANUAL';
      const isGamification = source !== 'GITHUB_SYNC';

      const currentGamificationXp = rating.gamificationXp ?? 0;
      const currentGithubXp = rating.githubXp ?? 0;

      const newGamificationXp = isGamification
        ? currentGamificationXp + dto.amount
        : currentGamificationXp;
      const newGithubXp = !isGamification
        ? currentGithubXp + dto.amount
        : currentGithubXp;
      const newTotalXp = newGithubXp + newGamificationXp;

      await tx.developerRating.update({
        where: { userId: dto.userId },
        data: {
          gamificationXp: newGamificationXp,
          githubXp: newGithubXp,
          xp: newTotalXp,
        },
      });

      // Append only: this service never updates/deletes existing audit rows.
      await tx.xpTransaction.create({
        data: {
          userId: dto.userId,
          amount: dto.amount,
          source,
          description: dto.reason.trim(),
        },
      });

      return this.levels.checkAndLevelUp(dto.userId, tx);
    };

    if (transaction) {
      return runWithTx(transaction);
    }
    return this.prisma.$transaction(async (tx) => runWithTx(tx));
  }

  async getXpHistory(
    userId: string,
    query: { page?: number; limit?: number; source?: string } = {},
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.source) {
      where.source = query.source;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.xpTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.xpTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
