import { BadRequestException, NotFoundException } from '@nestjs/common';
import { XpService } from './xp.service';
import { XpReconciliationService } from './xp-reconciliation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelsService } from '../levels/levels.service';

describe('Multi-Source XP Reconciliation & Stat Drift Prevention (#432)', () => {
  let xpService: XpService;
  let reconciliationService: XpReconciliationService;
  let levelsService: LevelsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      developerRating: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      xpTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'u1' }]),
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    levelsService = {
      checkAndLevelUp: jest.fn().mockResolvedValue({ id: 'r1', level: 2 }),
    } as unknown as LevelsService;

    xpService = new XpService(prisma as unknown as PrismaService, levelsService);
    reconciliationService = new XpReconciliationService(
      prisma as unknown as PrismaService,
      levelsService,
    );
  });

  describe('XpService.addXp atomic multi-source calculation', () => {
    it('increments gamificationXp, recalculates total xp = githubXp + gamificationXp, creates audit transaction, and checks level-up', async () => {
      prisma.developerRating.findUnique.mockResolvedValueOnce({
        userId: 'u1',
        githubXp: 500,
        gamificationXp: 150,
        xp: 650,
      });
      prisma.developerRating.update.mockResolvedValueOnce({
        userId: 'u1',
        githubXp: 500,
        gamificationXp: 250,
        xp: 750,
      });
      prisma.xpTransaction.create.mockResolvedValueOnce({
        id: 'tx1',
        userId: 'u1',
        amount: 100,
        source: 'BATTLE_WIN',
        description: 'Won battle',
      });

      await xpService.addXp({
        userId: 'u1',
        amount: 100,
        source: 'BATTLE_WIN',
        reason: 'Won battle',
      });

      expect(prisma.developerRating.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: {
          githubXp: 500,
          gamificationXp: 250,
          xp: 750,
        },
      });

      expect(prisma.xpTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: 100,
          source: 'BATTLE_WIN',
          description: 'Won battle',
        },
      });

      expect(levelsService.checkAndLevelUp).toHaveBeenCalledWith('u1', prisma);
    });

    it('rejects invalid XP amounts (negative, zero, or non-integer)', async () => {
      await expect(
        xpService.addXp({
          userId: 'u1',
          amount: -50,
          source: 'MANUAL',
          reason: 'Penalty',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('XpService.getXpHistory', () => {
    it('returns paginated XP transactions for the user', async () => {
      prisma.xpTransaction.findMany.mockResolvedValueOnce([
        { id: 'tx-1', amount: 100, source: 'BATTLE_WIN' },
      ]);
      prisma.xpTransaction.count.mockResolvedValueOnce(1);

      const result = await xpService.getXpHistory('u1', { page: 1, limit: 10 });

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.xpTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('XpReconciliationService', () => {
    it('detects stat drift when rating.gamificationXp differs from sum of xp_transactions and repairs DeveloperRating', async () => {
      prisma.developerRating.findUnique.mockResolvedValueOnce({
        userId: 'u1',
        githubXp: 1000,
        gamificationXp: 100, // Drifted: recorded 100 instead of real 300
        xp: 1100,
      });

      prisma.xpTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: 300 }, // True sum from transaction audit log
      });

      const outcome = await reconciliationService.reconcileUserXp('u1');

      expect(outcome.reconciled).toBe(true);
      expect(outcome.previousGamificationXp).toBe(100);
      expect(outcome.expectedGamificationXp).toBe(300);
      expect(outcome.previousTotalXp).toBe(1100);
      expect(outcome.newTotalXp).toBe(1300); // 1000 githubXp + 300 gamificationXp
      expect(outcome.drift).toBe(200);

      expect(prisma.developerRating.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: {
          gamificationXp: 300,
          xp: 1300,
        },
      });

      expect(levelsService.checkAndLevelUp).toHaveBeenCalledWith('u1', prisma);
    });

    it('returns reconciled=false when rating and transactions are already in sync', async () => {
      prisma.developerRating.findUnique.mockResolvedValueOnce({
        userId: 'u2',
        githubXp: 800,
        gamificationXp: 200,
        xp: 1000,
      });

      prisma.xpTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: 200 },
      });

      const outcome = await reconciliationService.reconcileUserXp('u2');

      expect(outcome.reconciled).toBe(false);
      expect(outcome.drift).toBe(0);
      expect(prisma.developerRating.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when developer rating does not exist', async () => {
      prisma.developerRating.findUnique.mockResolvedValueOnce(null);

      await expect(
        reconciliationService.reconcileUserXp('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('reconcileAllUsers iterates all users and audits their records', async () => {
      prisma.developerRating.findMany.mockResolvedValueOnce([
        { userId: 'u1' },
        { userId: 'u2' },
      ]);

      jest.spyOn(reconciliationService, 'reconcileUserXp').mockImplementation(async (userId) => {
        if (userId === 'u1') {
          return {
            userId: 'u1',
            reconciled: true,
            previousGamificationXp: 50,
            expectedGamificationXp: 150,
            previousTotalXp: 550,
            newTotalXp: 650,
            drift: 100,
          };
        }
        return {
          userId: 'u2',
          reconciled: false,
          previousGamificationXp: 100,
          expectedGamificationXp: 100,
          previousTotalXp: 900,
          newTotalXp: 900,
          drift: 0,
        };
      });

      const report = await reconciliationService.reconcileAllUsers();

      expect(report.auditedCount).toBe(2);
      expect(report.repairedCount).toBe(1);
      expect(report.results).toHaveLength(2);
    });
  });
});
