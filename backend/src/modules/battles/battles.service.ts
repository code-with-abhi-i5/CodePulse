import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBattleDto, UpdateBattleStatusDto } from './dto/battles.dto';

@Injectable()
export class BattlesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBattles() {
    return this.prisma.battle.findMany({
      where: { status: 'ACTIVE' },
      include: {
        challenger: { select: { id: true, username: true, avatar: true } },
        opponent: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async getUserBattles(userId: string) {
    return this.prisma.battle.findMany({
      where: {
        OR: [{ challengerId: userId }, { opponentId: userId }],
      },
      include: {
        challenger: { select: { id: true, username: true, avatar: true } },
        opponent: { select: { id: true, username: true, avatar: true } },
        winner: { select: { id: true, username: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async createBattle(dto: CreateBattleDto) {
    return this.prisma.battle.create({
      data: {
        ...dto,
        endsAt: new Date(dto.endsAt),
      },
    });
  }

  async updateBattleStatus(battleId: string, dto: UpdateBattleStatusDto) {
    const battle = await this.prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) {
      throw new NotFoundException(`Battle ${battleId} not found`);
    }

    return this.prisma.battle.update({
      where: { id: battleId },
      data: {
        status: dto.status,
        winnerId: dto.winnerId,
      },
    });
  }
}
