import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelsService } from '../levels/levels.service';

export interface ReconciliationResult {
  userId: string;
  reconciled: boolean;
  previousGamificationXp: number;
  expectedGamificationXp: number;
  previousTotalXp: number;
  newTotalXp: number;
  drift: number;
}

@Injectable()
export class XpReconciliationService {
  private readonly logger = new Logger(XpReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly levels: LevelsService,
  ) {}

  /**
   * Reconciles a single user's XP ledger against developerRating.
   * Calculates sum of all non-GITHUB XpTransaction records and repairs any stat drift.
   */
  async reconcileUserXp(userId: string): Promise<ReconciliationResult> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;

      const rating = await tx.developerRating.findUnique({
        where: { userId },
      });
      if (!rating) {
        throw new NotFoundException(
          `Developer rating record not found for user ${userId}`,
        );
      }

      // Aggregate all non-GITHUB gamification transactions
      const agg = await tx.xpTransaction.aggregate({
        where: {
          userId,
          source: { not: 'GITHUB_SYNC' },
        },
        _sum: { amount: true },
      });

      const expectedGamificationXp = agg._sum.amount ?? 0;
      const expectedTotalXp = (rating.githubXp ?? 0) + expectedGamificationXp;

      const drift = expectedTotalXp - rating.xp;
      const needsReconciliation =
        rating.gamificationXp !== expectedGamificationXp ||
        rating.xp !== expectedTotalXp;

      if (needsReconciliation) {
        this.logger.warn(
          `Stat drift detected for user ${userId}: recorded xp=${rating.xp} (gamification=${rating.gamificationXp}), expected xp=${expectedTotalXp} (gamification=${expectedGamificationXp}). Repairing...`,
        );

        await tx.developerRating.update({
          where: { userId },
          data: {
            gamificationXp: expectedGamificationXp,
            xp: expectedTotalXp,
          },
        });

        await this.levels.checkAndLevelUp(userId, tx);
      }

      return {
        userId,
        reconciled: needsReconciliation,
        previousGamificationXp: rating.gamificationXp,
        expectedGamificationXp,
        previousTotalXp: rating.xp,
        newTotalXp: expectedTotalXp,
        drift,
      };
    });
  }

  /**
   * Audits all users in the system and self-heals any drifted accounts.
   */
  async reconcileAllUsers(): Promise<{
    auditedCount: number;
    repairedCount: number;
    results: ReconciliationResult[];
  }> {
    const ratings = await this.prisma.developerRating.findMany({
      select: { userId: true },
    });

    const results: ReconciliationResult[] = [];
    let repairedCount = 0;

    for (const r of ratings) {
      try {
        const res = await this.reconcileUserXp(r.userId);
        results.push(res);
        if (res.reconciled) {
          repairedCount++;
        }
      } catch (err) {
        this.logger.error(`Failed to reconcile user ${r.userId}: ${err}`);
      }
    }

    return {
      auditedCount: ratings.length,
      repairedCount,
      results,
    };
  }
}
