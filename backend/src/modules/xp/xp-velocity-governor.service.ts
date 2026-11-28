import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface VelocityCheckResult {
  allowed: boolean;
  remainingDailyQuota: number;
  currentDailyAccrual: number;
  flaggedAnomaly: boolean;
  anomalyScore: number;
}

@Injectable()
export class XpVelocityGovernorService {
  private readonly logger = new Logger(XpVelocityGovernorService.name);

  // Configurable limits
  public static readonly DAILY_GAMIFICATION_CAP = 2500;
  public static readonly SINGLE_TRANSACTION_CAP = 500;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts whether an XP award adheres to rolling velocity ceilings and daily quotas.
   */
  async checkAndRecordVelocity(
    userId: string,
    amount: number,
    source = 'MANUAL',
  ): Promise<VelocityCheckResult> {
    const isGamification = source !== 'GITHUB_SYNC';
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Single transaction anomaly evaluation
    const isSpecialExempt =
      source === 'SEASONAL_BOSS' || source === 'TOURNAMENT_CHAMPION';
    const flaggedAnomaly =
      isGamification &&
      !isSpecialExempt &&
      amount > XpVelocityGovernorService.SINGLE_TRANSACTION_CAP;

    const anomalyScore = flaggedAnomaly
      ? Number((amount / XpVelocityGovernorService.SINGLE_TRANSACTION_CAP).toFixed(2))
      : 1.0;

    // 2. Fetch or initialize today's accrual
    const accrual = await this.prisma.xpDailyAccrual.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        gamificationXp: isGamification ? amount : 0,
        githubXp: !isGamification ? amount : 0,
        totalXp: amount,
      },
      update: {
        gamificationXp: isGamification
          ? { increment: amount }
          : undefined,
        githubXp: !isGamification
          ? { increment: amount }
          : undefined,
        totalXp: { increment: amount },
      },
    });

    const currentGamification = accrual.gamificationXp;
    const remainingQuota = Math.max(
      0,
      XpVelocityGovernorService.DAILY_GAMIFICATION_CAP - currentGamification,
    );

    // 3. Daily quota ceiling enforcement
    if (
      isGamification &&
      !isSpecialExempt &&
      currentGamification > XpVelocityGovernorService.DAILY_GAMIFICATION_CAP
    ) {
      this.logger.warn(
        `User ${userId} exceeded daily gamification XP ceiling (${currentGamification} / ${XpVelocityGovernorService.DAILY_GAMIFICATION_CAP})`,
      );
      throw new HttpException(
        `Daily gamification XP ceiling exceeded. Maximum ${XpVelocityGovernorService.DAILY_GAMIFICATION_CAP} XP per rolling 24h. Remaining quota: 0.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return {
      allowed: true,
      remainingDailyQuota: remainingQuota,
      currentDailyAccrual: currentGamification,
      flaggedAnomaly,
      anomalyScore,
    };
  }

  /**
   * Retrieves today's remaining XP quota and limits for a user.
   */
  async getUserDailyQuota(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const accrual = await this.prisma.xpDailyAccrual.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const usedGamification = accrual?.gamificationXp || 0;
    const usedGithub = accrual?.githubXp || 0;

    return {
      date: today,
      dailyGamificationCap: XpVelocityGovernorService.DAILY_GAMIFICATION_CAP,
      usedGamification,
      remainingGamificationQuota: Math.max(
        0,
        XpVelocityGovernorService.DAILY_GAMIFICATION_CAP - usedGamification,
      ),
      usedGithub,
      totalXpToday: accrual?.totalXp || 0,
    };
  }
}
