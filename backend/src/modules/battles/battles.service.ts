import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBattleDto, UpdateBattleStatusDto } from './dto/battles.dto';
import { SeasonResetService } from './season-reset.service';
import { XpService } from '../xp/xp.service';
import {
  placementKFactor,
  remainingPlacementsAfterMatch,
  tierForElo,
} from './season-rating';
import { decayFloorForElo } from './rating-decay';

export interface EloOutcome {
  winnerRating: number;
  loserRating: number;
  winnerDelta: number;
  loserDelta: number;
  winnerXpGain: number;
  loserXpGain: number;
}

@Injectable()
export class BattlesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly seasonReset?: SeasonResetService,
    @Optional() private readonly xpService?: XpService,
  ) {}

  /**
   * Calculates competitive ELO outcome and dynamic XP rewards (K-factor = 32).
   */
  public calculateElo(
    winnerRating: number,
    loserRating: number,
    winnerKFactor = 32,
    loserKFactor = winnerKFactor,
  ): EloOutcome {
    // Expected score formula: EA = 1 / (1 + 10^((RB - RA) / 400))
    const expectedWinner =
      1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser =
      1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // Underdog multiplier gives an extra proportionate reward if a lower-rated player defeats a titan
    let winnerDelta = Math.round(winnerKFactor * (1 - expectedWinner));
    const loserDelta = Math.round(loserKFactor * (0 - expectedLoser));

    // Ensure winner always gains at least 8 ELO and loser loses at most proportional points
    winnerDelta = Math.max(8, winnerDelta);

    const winnerXpGain = 150;
    const loserXpGain = 25; // Participation reward

    return {
      winnerRating: winnerRating + winnerDelta,
      loserRating: Math.max(100, loserRating + loserDelta), // Floor rating at 100
      winnerDelta,
      loserDelta,
      winnerXpGain,
      loserXpGain,
    };
  }

  async getActiveBattles() {
    return this.prisma.battle.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { gt: new Date() },
      },
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

  async getHeadToHead(username1: string, username2: string) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [username1, username2].map((username) => ({
          username: { equals: username, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, username: true },
    });
    const first = users.find(
      (user) => user.username.toLowerCase() === username1.toLowerCase(),
    );
    const second = users.find(
      (user) => user.username.toLowerCase() === username2.toLowerCase(),
    );
    if (!first || !second) {
      return {
        user1Wins: 0,
        user2Wins: 0,
        draws: 0,
        totalMatches: 0,
        latest: null,
      };
    }

    const matches = await this.prisma.battle.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { challengerId: first.id, opponentId: second.id },
          { challengerId: second.id, opponentId: first.id },
        ],
      },
      select: {
        challengerId: true,
        winnerId: true,
        startedAt: true,
        category: true,
        challengerScore: true,
        opponentScore: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    const latest = matches[0];
    return {
      user1Wins: matches.filter((match) => match.winnerId === first.id).length,
      user2Wins: matches.filter((match) => match.winnerId === second.id).length,
      draws: matches.filter((match) => !match.winnerId).length,
      totalMatches: matches.length,
      latest: latest
        ? {
            date: latest.startedAt,
            category: latest.category,
            user1Score:
              latest.challengerId === first.id
                ? latest.challengerScore
                : latest.opponentScore,
            user2Score:
              latest.challengerId === first.id
                ? latest.opponentScore
                : latest.challengerScore,
            winner:
              latest.winnerId === first.id
                ? username1
                : latest.winnerId === second.id
                  ? username2
                  : null,
          }
        : null,
    };
  }

  async createBattle(dto: CreateBattleDto) {
    if (dto.challengerId === dto.opponentId) {
      throw new BadRequestException(
        'Challenger and opponent cannot be the same user',
      );
    }

    const endsAt = new Date(dto.endsAt);
    if (isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      throw new BadRequestException('Battle endsAt must be a valid future date');
    }

    const [challenger, opponent] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.challengerId } }),
      this.prisma.user.findUnique({ where: { id: dto.opponentId } }),
    ]);

    if (!challenger) {
      throw new NotFoundException(
        `Challenger user ${dto.challengerId} not found`,
      );
    }
    if (!opponent) {
      throw new NotFoundException(`Opponent user ${dto.opponentId} not found`);
    }

    const existingActive = await this.prisma.battle.findFirst({
      where: {
        status: 'ACTIVE',
        endsAt: { gt: new Date() },
        OR: [
          { challengerId: dto.challengerId },
          { opponentId: dto.challengerId },
          { challengerId: dto.opponentId },
          { opponentId: dto.opponentId },
        ],
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'One of the participants already has an active battle in progress',
      );
    }

    return this.prisma.battle.create({
      data: {
        ...dto,
        endsAt,
      },
      include: {
        challenger: { select: { id: true, username: true, avatar: true } },
        opponent: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async updateBattleStatus(
    battleId: string,
    dto: UpdateBattleStatusDto,
    callerUserId?: string,
  ) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!battle) {
      throw new NotFoundException(`Battle ${battleId} not found`);
    }

    if (
      callerUserId &&
      battle.challengerId !== callerUserId &&
      battle.opponentId !== callerUserId
    ) {
      throw new ForbiddenException(
        'Only battle participants can update the battle status',
      );
    }

    const terminalStatuses = ['COMPLETED', 'FORFEITED', 'EXPIRED', 'CANCELLED'];
    if (terminalStatuses.includes(battle.status)) {
      if (battle.status === dto.status) {
        return battle;
      }
      throw new BadRequestException(
        `Cannot modify battle in terminal status: ${battle.status}`,
      );
    }

    if (dto.status === 'FORFEITED') {
      const forfeitedUserId =
        dto.forfeitedById || callerUserId || battle.challengerId;
      return this.forfeitBattle(
        battleId,
        forfeitedUserId,
        dto.cancellationReason,
      );
    }

    if (dto.status === 'EXPIRED') {
      return this.prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'EXPIRED',
          cancellationReason:
            dto.cancellationReason || 'Battle duration exceeded',
        },
      });
    }

    const currentSeason =
      dto.status === 'COMPLETED' && dto.winnerId
        ? await this.seasonReset?.rolloverIfDue()
        : undefined;

    if (
      dto.winnerId &&
      dto.winnerId !== battle.challengerId &&
      dto.winnerId !== battle.opponentId
    ) {
      throw new BadRequestException(
        'Winner must be a participant in the battle',
      );
    }

    // If a winner is declared and status is COMPLETED, atomically update ELO and XP
    if (dto.status === 'COMPLETED' && dto.winnerId) {
      const winnerId = dto.winnerId;
      const loserId =
        winnerId === battle.challengerId
          ? battle.opponentId
          : battle.challengerId;

      const [
        winnerRatingRec,
        loserRatingRec,
        winnerBattleRating,
        loserBattleRating,
      ] = await Promise.all([
        this.prisma.developerRating.findUnique({ where: { userId: winnerId } }),
        this.prisma.developerRating.findUnique({ where: { userId: loserId } }),
        this.prisma.battleRating.findUnique({ where: { userId: winnerId } }),
        this.prisma.battleRating.findUnique({ where: { userId: loserId } }),
      ]);

      const initialWinnerRating = winnerBattleRating?.elo ?? 1200;
      const initialLoserRating = loserBattleRating?.elo ?? 1200;

      const eloOutcome = this.calculateElo(
        initialWinnerRating,
        initialLoserRating,
        placementKFactor(winnerBattleRating?.placementMatchesRemaining ?? 5),
        placementKFactor(loserBattleRating?.placementMatchesRemaining ?? 5),
      );

      // Execute all rating, XP, activity, and battle status updates atomically in a Prisma Transaction
      return this.prisma.$transaction(async (tx) => {
        const completedAt = new Date();
        // Competitive MMR is stored separately from GitHub productivity rating.
        await tx.battleRating.upsert({
          where: { userId: winnerId },
          create: {
            userId: winnerId,
            elo: eloOutcome.winnerRating,
            placementMatchesRemaining: 4,
            seasonNumber: currentSeason?.number ?? 1,
            lastBattleAt: completedAt,
            decayFloor: decayFloorForElo(eloOutcome.winnerRating),
          },
          update: {
            elo: eloOutcome.winnerRating,
            lastBattleAt: completedAt,
            decayPeriodsApplied: 0,
            decayFloor: decayFloorForElo(eloOutcome.winnerRating),
            decayWarnedFor: null,
            placementMatchesRemaining: remainingPlacementsAfterMatch(
              winnerBattleRating?.placementMatchesRemaining ?? 5,
            ),
          },
        });
        await tx.battleRating.upsert({
          where: { userId: loserId },
          create: {
            userId: loserId,
            elo: eloOutcome.loserRating,
            placementMatchesRemaining: 4,
            seasonNumber: currentSeason?.number ?? 1,
            lastBattleAt: completedAt,
            decayFloor: decayFloorForElo(eloOutcome.loserRating),
          },
          update: {
            elo: eloOutcome.loserRating,
            lastBattleAt: completedAt,
            decayPeriodsApplied: 0,
            decayFloor: decayFloorForElo(eloOutcome.loserRating),
            decayWarnedFor: null,
            placementMatchesRemaining: remainingPlacementsAfterMatch(
              loserBattleRating?.placementMatchesRemaining ?? 5,
            ),
          },
        });

        // The fifth placement match grants a visible tier badge for this season.
        for (const player of [
          {
            userId: winnerId,
            rating: winnerBattleRating,
            elo: eloOutcome.winnerRating,
          },
          {
            userId: loserId,
            rating: loserBattleRating,
            elo: eloOutcome.loserRating,
          },
        ]) {
          if (player.rating?.placementMatchesRemaining !== 1) continue;
          const tier = tierForElo(player.elo);
          const seasonNumber =
            currentSeason?.number ?? player.rating.seasonNumber;
          const badgeId = `season-${seasonNumber}-${tier.toLowerCase()}-tier`;
          await tx.badge.upsert({
            where: { id: badgeId },
            create: {
              id: badgeId,
              name: `Season ${seasonNumber} ${tier} Tier`,
              description: `Completed five placement matches in season ${seasonNumber}`,
              tier:
                tier === 'MASTER' || tier === 'GRANDMASTER' ? 'DIAMOND' : tier,
              category: 'seasonal-placement',
            },
            update: {},
          });
          await tx.userBadge.createMany({
            data: [{ userId: player.userId, badgeId }],
            skipDuplicates: true,
          });
          await tx.activity.create({
            data: {
              userId: player.userId,
              type: 'ACHIEVEMENT',
              title: `${tier} placement rank revealed`,
              description: `Completed five placement matches in season ${seasonNumber}.`,
            },
          });
        }

        const winnerName =
          winnerId === battle.challengerId
            ? battle.challenger.username
            : battle.opponent.username;
        const loserName =
          loserId === battle.challengerId
            ? battle.challenger.username
            : battle.opponent.username;

        if (this.xpService) {
          await this.xpService.addXp(
            {
              userId: winnerId,
              amount: eloOutcome.winnerXpGain,
              source: 'BATTLE_WIN',
              reason: `Won DevBattle match against ${loserName}`,
            },
            tx,
          );
          await this.xpService.addXp(
            {
              userId: loserId,
              amount: eloOutcome.loserXpGain,
              source: 'BATTLE_PARTICIPATION',
              reason: `Completed DevBattle match against ${winnerName}`,
            },
            tx,
          );
        } else {
          await tx.developerRating.upsert({
            where: { userId: winnerId },
            create: {
              userId: winnerId,
              gamificationXp: eloOutcome.winnerXpGain,
              xp: eloOutcome.winnerXpGain,
            },
            update: {
              gamificationXp: { increment: eloOutcome.winnerXpGain },
              xp: { increment: eloOutcome.winnerXpGain },
            },
          });
          await tx.developerRating.upsert({
            where: { userId: loserId },
            create: {
              userId: loserId,
              gamificationXp: eloOutcome.loserXpGain,
              xp: eloOutcome.loserXpGain,
            },
            update: {
              gamificationXp: { increment: eloOutcome.loserXpGain },
              xp: { increment: eloOutcome.loserXpGain },
            },
          });
        }

        await tx.activity.createMany({
          data: [
            {
              userId: winnerId,
              type: 'BATTLE',
              title: 'Won a DevBattle',
              description: `Defeated ${loserName} in a DevBattle match.`,
              metadata: { battleId, outcome: 'win' },
            },
            {
              userId: loserId,
              type: 'BATTLE',
              title: 'Completed a DevBattle',
              description: `Played against ${winnerName} in a DevBattle match.`,
              metadata: { battleId, outcome: 'loss' },
            },
          ],
        });

        // 4. Update Battle Status to COMPLETED
        return tx.battle.update({
          where: { id: battleId },
          data: {
            status: dto.status,
            winnerId: dto.winnerId,
          },
        });
      });
    }

    // Default status update if not finished with winner
    return this.prisma.battle.update({
      where: { id: battleId },
      data: {
        status: dto.status,
        winnerId: dto.winnerId,
      },
    });
  }

  async forfeitBattle(
    battleId: string,
    forfeitedUserId: string,
    reason = 'Player forfeited',
  ) {
    const battle = await this.prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!battle) {
      throw new NotFoundException(`Battle ${battleId} not found`);
    }

    if (
      battle.challengerId !== forfeitedUserId &&
      battle.opponentId !== forfeitedUserId
    ) {
      throw new ForbiddenException(
        'Only battle participants can forfeit the battle',
      );
    }

    if (battle.status !== 'ACTIVE' && battle.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot forfeit battle in ${battle.status} status`,
      );
    }

    // If PENDING challenge is forfeited/declined before match starts
    if (battle.status === 'PENDING') {
      return this.prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'FORFEITED',
          forfeitedById: forfeitedUserId,
          cancellationReason: reason,
        },
      });
    }

    // For ACTIVE battles, the non-forfeiting participant wins
    const winnerId =
      forfeitedUserId === battle.challengerId
        ? battle.opponentId
        : battle.challengerId;
    const loserId = forfeitedUserId;

    const currentSeason = await this.seasonReset?.rolloverIfDue();

    const [
      winnerRatingRec,
      loserRatingRec,
      winnerBattleRating,
      loserBattleRating,
    ] = await Promise.all([
      this.prisma.developerRating.findUnique({ where: { userId: winnerId } }),
      this.prisma.developerRating.findUnique({ where: { userId: loserId } }),
      this.prisma.battleRating.findUnique({ where: { userId: winnerId } }),
      this.prisma.battleRating.findUnique({ where: { userId: loserId } }),
    ]);

    const initialWinnerRating = winnerBattleRating?.elo ?? 1200;
    const initialLoserRating = loserBattleRating?.elo ?? 1200;

    const eloOutcome = this.calculateElo(
      initialWinnerRating,
      initialLoserRating,
      placementKFactor(winnerBattleRating?.placementMatchesRemaining ?? 5),
      placementKFactor(loserBattleRating?.placementMatchesRemaining ?? 5),
    );

    return this.prisma.$transaction(async (tx) => {
      const completedAt = new Date();

      await tx.battleRating.upsert({
        where: { userId: winnerId },
        create: {
          userId: winnerId,
          elo: eloOutcome.winnerRating,
          placementMatchesRemaining: 4,
          seasonNumber: currentSeason?.number ?? 1,
          lastBattleAt: completedAt,
          decayFloor: decayFloorForElo(eloOutcome.winnerRating),
        },
        update: {
          elo: eloOutcome.winnerRating,
          lastBattleAt: completedAt,
          decayPeriodsApplied: 0,
          decayFloor: decayFloorForElo(eloOutcome.winnerRating),
          decayWarnedFor: null,
          placementMatchesRemaining: remainingPlacementsAfterMatch(
            winnerBattleRating?.placementMatchesRemaining ?? 5,
          ),
        },
      });

      await tx.battleRating.upsert({
        where: { userId: loserId },
        create: {
          userId: loserId,
          elo: eloOutcome.loserRating,
          placementMatchesRemaining: 4,
          seasonNumber: currentSeason?.number ?? 1,
          lastBattleAt: completedAt,
          decayFloor: decayFloorForElo(eloOutcome.loserRating),
        },
        update: {
          elo: eloOutcome.loserRating,
          lastBattleAt: completedAt,
          decayPeriodsApplied: 0,
          decayFloor: decayFloorForElo(eloOutcome.loserRating),
          decayWarnedFor: null,
          placementMatchesRemaining: remainingPlacementsAfterMatch(
            loserBattleRating?.placementMatchesRemaining ?? 5,
          ),
        },
      });

      // Grant placement badges if 5th match completed
      for (const player of [
        {
          userId: winnerId,
          rating: winnerBattleRating,
          elo: eloOutcome.winnerRating,
        },
        {
          userId: loserId,
          rating: loserBattleRating,
          elo: eloOutcome.loserRating,
        },
      ]) {
        if (player.rating?.placementMatchesRemaining !== 1) continue;
        const tier = tierForElo(player.elo);
        const seasonNumber =
          currentSeason?.number ?? player.rating.seasonNumber;
        const badgeId = `season-${seasonNumber}-${tier.toLowerCase()}-tier`;
        await tx.badge.upsert({
          where: { id: badgeId },
          create: {
            id: badgeId,
            name: `Season ${seasonNumber} ${tier} Tier`,
            description: `Completed five placement matches in season ${seasonNumber}`,
            tier:
              tier === 'MASTER' || tier === 'GRANDMASTER' ? 'DIAMOND' : tier,
            category: 'seasonal-placement',
          },
          update: {},
        });
        await tx.userBadge.createMany({
          data: [{ userId: player.userId, badgeId }],
          skipDuplicates: true,
        });
        await tx.activity.create({
          data: {
            userId: player.userId,
            type: 'ACHIEVEMENT',
            title: `${tier} placement rank revealed`,
            description: `Completed five placement matches in season ${seasonNumber}.`,
          },
        });
      }

      // Update Winner XP
      let winnerXp = (winnerRatingRec?.xp || 0) + eloOutcome.winnerXpGain;
      let winnerLevel = winnerRatingRec?.level || 1;
      let winnerXpToNext = winnerRatingRec?.xpToNextLevel || 1000;
      let leveledUp = false;

      while (winnerXp >= winnerXpToNext) {
        winnerLevel += 1;
        winnerXp -= winnerXpToNext;
        winnerXpToNext = Math.floor(winnerXpToNext * 1.5);
        leveledUp = true;
      }

      await tx.developerRating.upsert({
        where: { userId: winnerId },
        create: {
          userId: winnerId,
          xp: winnerXp,
          level: winnerLevel,
          xpToNextLevel: winnerXpToNext,
        },
        update: {
          xp: winnerXp,
          level: winnerLevel,
          xpToNextLevel: winnerXpToNext,
        },
      });

      if (leveledUp) {
        await tx.activity.create({
          data: {
            userId: winnerId,
            type: 'LEVEL_UP',
            title: `Reached Developer Level ${winnerLevel}!`,
            description: `Leveled up after victory by forfeit in DevBattle!`,
          },
        });
      }

      const winnerName =
        winnerId === battle.challengerId
          ? battle.challenger.username
          : battle.opponent.username;
      const loserName =
        loserId === battle.challengerId
          ? battle.challenger.username
          : battle.opponent.username;

      await tx.notification.createMany({
        data: [
          {
            userId: winnerId,
            type: 'BATTLE',
            title: 'Battle Victory by Forfeit',
            message: `${loserName} forfeited the battle. You gained ${eloOutcome.winnerDelta} ELO and ${eloOutcome.winnerXpGain} XP.`,
          },
          {
            userId: loserId,
            type: 'BATTLE',
            title: 'Battle Forfeited',
            message: `You forfeited the battle against ${winnerName}. Rating adjusted by ${eloOutcome.loserDelta} ELO.`,
          },
        ],
      });

      await tx.activity.createMany({
        data: [
          {
            userId: winnerId,
            type: 'BATTLE',
            title: 'Won a DevBattle (Forfeit)',
            description: `${loserName} forfeited the battle match.`,
            metadata: { battleId, outcome: 'forfeit_win' },
          },
          {
            userId: loserId,
            type: 'BATTLE',
            title: 'Forfeited a DevBattle',
            description: `Forfeited match against ${winnerName}.`,
            metadata: { battleId, outcome: 'forfeit_loss' },
          },
        ],
      });

      return tx.battle.update({
        where: { id: battleId },
        data: {
          status: 'FORFEITED',
          winnerId,
          forfeitedById: loserId,
          cancellationReason: reason,
        },
      });
    });
  }

  async expireStaleBattles(now: Date = new Date()): Promise<{
    expiredCount: number;
    forfeitedCount: number;
  }> {
    const pendingExpirationCutoff = new Date(
      now.getTime() - 24 * 60 * 60 * 1000,
    );
    const stalePending = await this.prisma.battle.updateMany({
      where: {
        status: 'PENDING',
        OR: [
          { endsAt: { lte: now } },
          { startedAt: { lte: pendingExpirationCutoff } },
        ],
      },
      data: {
        status: 'EXPIRED',
        cancellationReason: 'Challenge invitation expired without acceptance',
      },
    });

    let expiredCount = stalePending.count;
    let forfeitedCount = 0;

    const staleActive = await this.prisma.battle.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now },
      },
    });

    for (const battle of staleActive) {
      const challengerScore = battle.challengerScore ?? 0;
      const opponentScore = battle.opponentScore ?? 0;

      if (challengerScore > opponentScore) {
        await this.forfeitBattle(
          battle.id,
          battle.opponentId,
          'Auto-forfeited due to time expiration while trailing in score',
        );
        forfeitedCount++;
      } else if (opponentScore > challengerScore) {
        await this.forfeitBattle(
          battle.id,
          battle.challengerId,
          'Auto-forfeited due to time expiration while trailing in score',
        );
        forfeitedCount++;
      } else {
        await this.prisma.battle.update({
          where: { id: battle.id },
          data: {
            status: 'EXPIRED',
            cancellationReason: 'Battle expired without decisive winner',
          },
        });
        expiredCount++;
      }
    }

    return { expiredCount, forfeitedCount };
  }
}
