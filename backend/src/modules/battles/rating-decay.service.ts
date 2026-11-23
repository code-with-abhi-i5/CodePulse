import { Injectable, Logger } from '@nestjs/common';
import { BattleRating, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  decayAmount,
  decayFloorForElo,
  dueDecayPeriods,
  nextDecayRunFromWarning,
} from './rating-decay';

const PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReturningPlayerCalibration {
  userId: string;
  currentElo: number;
  historicalPeakElo: number;
  provisionalMultiplier: number;
  calibratedEloGain: number;
  antiSmurfAction: 'ACCELERATED_RETURN' | 'STANDARD';
  reason: string;
}

@Injectable()
export class RatingDecayService {
  private readonly logger = new Logger(RatingDecayService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async *eligibleRatings(cutoff: Date): AsyncGenerator<BattleRating> {
    let cursor: string | undefined;
    while (true) {
      const page = await this.prisma.battleRating.findMany({
        where: {
          lastBattleAt: { lte: cutoff },
          placementMatchesRemaining: 0,
        },
        orderBy: { userId: 'asc' },
        take: PAGE_SIZE,
        ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
      });
      for (const rating of page) yield rating;
      if (page.length < PAGE_SIZE) return;
      cursor = page[page.length - 1].userId;
    }
  }

  async runDecay(now = new Date()): Promise<number> {
    const cutoff = new Date(now.getTime() - 14 * DAY_MS);
    let affected = 0;
    for await (const rating of this.eligibleRatings(cutoff)) {
      if (!rating.lastBattleAt) continue;
      const floor = rating.decayFloor ?? decayFloorForElo(rating.elo);
      if (floor === null) continue;
      const periods = dueDecayPeriods(rating.lastBattleAt, now);
      const deduction = decayAmount(
        rating.elo,
        floor,
        periods,
        rating.decayPeriodsApplied,
      );
      if (deduction <= 0) continue;

      // The conditional update prevents retries or parallel workers from double-charging.
      const changed = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.battleRating.updateMany({
          where: {
            userId: rating.userId,
            lastBattleAt: rating.lastBattleAt,
            decayPeriodsApplied: rating.decayPeriodsApplied,
            elo: rating.elo,
          },
          data: {
            elo: Math.max(floor, rating.elo - deduction),
            decayPeriodsApplied: periods,
          },
        });
        if (updated.count !== 1) return false;
        // Elo is separate from XP. A zero-amount ledger record logs the Elo change
        // without debiting the player's XP balance.
        await tx.xpTransaction.create({
          data: {
            userId: rating.userId,
            source: 'RATING_DECAY',
            amount: 0,
            description: `Competitive Elo decreased by ${deduction} after ${periods} inactive week(s); floor ${floor}.`,
          },
        });
        return true;
      });
      if (changed) affected++;
    }
    this.logger.log(`Weekly rating decay updated ${affected} player(s)`);
    return affected;
  }

  async sendWarnings(now = new Date()): Promise<number> {
    const nextRun = nextDecayRunFromWarning(now);
    const cutoff = new Date(nextRun.getTime() - 14 * DAY_MS);
    let sent = 0;
    for await (const rating of this.eligibleRatings(cutoff)) {
      if (!rating.lastBattleAt) continue;
      const floor = rating.decayFloor ?? decayFloorForElo(rating.elo);
      if (
        floor === null ||
        rating.decayWarnedFor?.getTime() === nextRun.getTime()
      ) {
        continue;
      }
      const periods = dueDecayPeriods(rating.lastBattleAt, nextRun);
      const deduction = decayAmount(
        rating.elo,
        floor,
        periods,
        rating.decayPeriodsApplied,
      );
      if (deduction <= 0) continue;

      const created = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.battleRating.updateMany({
          where: {
            userId: rating.userId,
            lastBattleAt: rating.lastBattleAt,
            decayPeriodsApplied: rating.decayPeriodsApplied,
            elo: rating.elo,
            OR: [
              { decayWarnedFor: null },
              { decayWarnedFor: { not: nextRun } },
            ],
          },
          data: { decayWarnedFor: nextRun },
        });
        if (updated.count !== 1) return false;
        await tx.notification.create({
          data: {
            userId: rating.userId,
            type: NotificationType.SYSTEM,
            title: 'Competitive rating decay in 48 hours',
            message: `Play a ranked battle before Monday 00:00 UTC to avoid a ${deduction}-point Elo deduction.`,
            metadata: { scheduledFor: nextRun.toISOString(), deduction },
          },
        });
        return true;
      });
      if (created) sent++;
    }
    this.logger.log(`Sent ${sent} rating decay warning(s)`);
    return sent;
  }

  /**
   * Anti-Smurf Placement Calibration:
   * Prevents veteran players who experienced seasonal or inactivity decay from
   * smurfing in lower skill tiers by accelerating Elo gains until they approach their peak tier.
   */
  public calibrateReturningPlayerPlacement(
    userId: string,
    currentElo: number,
    historicalPeakElo: number,
    baseWinDelta = 25,
  ): ReturningPlayerCalibration {
    const eloDeficit = historicalPeakElo - currentElo;

    if (eloDeficit >= 250) {
      // Scale multiplier based on gap: 2.0x for 250 gap, up to 3.0x for 500+ gap
      const multiplier = Math.min(3.0, 1.5 + (eloDeficit - 250) / 250);
      const calibratedGain = Math.round(baseWinDelta * multiplier);

      return {
        userId,
        currentElo,
        historicalPeakElo,
        provisionalMultiplier: Number(multiplier.toFixed(2)),
        calibratedEloGain: calibratedGain,
        antiSmurfAction: 'ACCELERATED_RETURN',
        reason: `Returning veteran deficit of ${eloDeficit} Elo points detected. Accelerating MMR (${multiplier.toFixed(1)}x) to protect beginner tier integrity.`,
      };
    }

    return {
      userId,
      currentElo,
      historicalPeakElo,
      provisionalMultiplier: 1.0,
      calibratedEloGain: baseWinDelta,
      antiSmurfAction: 'STANDARD',
      reason: 'Current Elo matches historical skill bracket.',
    };
  }
}
