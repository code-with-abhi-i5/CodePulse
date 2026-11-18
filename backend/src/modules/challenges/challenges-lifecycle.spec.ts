import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChallengeStatus, ChallengeType } from '@prisma/client';
import { ChallengesWorker } from './challenges.worker';

describe('Challenges Lifecycle State Machine & Concurrency Engine (#502)', () => {
  let service: ChallengesService;
  let prisma: any;
  let xpService: any;

  beforeEach(() => {
    prisma = {
      challenge: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userChallenge: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      developerRating: {
        updateMany: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      activity: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    xpService = {
      addXp: jest.fn().mockResolvedValue({}),
    };

    service = new ChallengesService(
      prisma as unknown as PrismaService,
      xpService,
    );
  });

  describe('calculateExpiration multi-tier duration engine', () => {
    const fixedNow = new Date('2026-03-04T10:00:00.000Z'); // Wednesday

    it('calculates DAILY expiration at 23:59:59.999 of the same day', () => {
      const exp = service.calculateExpiration('DAILY' as ChallengeType, fixedNow);
      expect(exp.getDate()).toBe(4);
      expect(exp.getHours()).toBe(23);
      expect(exp.getMinutes()).toBe(59);
    });

    it('calculates WEEKLY expiration on Sunday at 23:59:59.999', () => {
      const exp = service.calculateExpiration('WEEKLY' as ChallengeType, fixedNow);
      expect(exp.getDay()).toBe(0); // Sunday
      expect(exp.getDate()).toBe(8); // March 4 + 4 days = March 8 (Sunday)
    });

    it('calculates MONTHLY expiration on the last day of the current month', () => {
      const exp = service.calculateExpiration('MONTHLY' as ChallengeType, fixedNow);
      expect(exp.getMonth()).toBe(2); // March
      expect(exp.getDate()).toBe(31); // March has 31 days
    });

    it('calculates SEASONAL expiration ~30 days in the future', () => {
      const exp = service.calculateExpiration('SEASONAL' as ChallengeType, fixedNow);
      const diffDays = Math.round(
        (exp.getTime() - fixedNow.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBe(30);
    });
  });

  describe('generateDailyChallenges idempotency', () => {
    it('creates new challenges with appropriate expirations and skips already active templates', async () => {
      // First template already active
      prisma.challenge.findFirst.mockResolvedValueOnce({ id: 'existing-daily' });
      // Other 4 templates not active
      prisma.challenge.findFirst.mockResolvedValue(null);
      prisma.challenge.create.mockResolvedValue({ id: 'new-ch' });

      const result = await service.generateDailyChallenges(new Date());

      expect(result.createdCount).toBe(4);
      expect(prisma.challenge.create).toHaveBeenCalledTimes(4);
    });
  });

  describe('processUserActivity atomic progress & completion', () => {
    it('creates userChallenge if not present, updates progress, and transitions to COMPLETED at target', async () => {
      const challenge = {
        id: 'c1',
        title: 'Commit Master',
        target: 5,
        xpReward: 100,
        category: 'COMMITS',
      };
      prisma.challenge.findMany.mockResolvedValueOnce([challenge]);
      prisma.userChallenge.findUnique.mockResolvedValueOnce(null);
      prisma.userChallenge.create.mockResolvedValueOnce({
        id: 'uc1',
        userId: 'user-1',
        challengeId: 'c1',
        progress: 0,
        status: ChallengeStatus.IN_PROGRESS,
        isCompleted: false,
      });

      await service.processUserActivity('user-1', 'COMMITS', 5);

      expect(prisma.userChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uc1' },
          data: expect.objectContaining({
            progress: 5,
            isCompleted: true,
            status: ChallengeStatus.COMPLETED,
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.activity.create).toHaveBeenCalled();
    });

    it('ignores activity if userChallenge is already completed or claimed', async () => {
      const challenge = {
        id: 'c1',
        title: 'Commit Master',
        target: 5,
        xpReward: 100,
        category: 'COMMITS',
      };
      prisma.challenge.findMany.mockResolvedValueOnce([challenge]);
      prisma.userChallenge.findUnique.mockResolvedValueOnce({
        id: 'uc1',
        userId: 'user-1',
        challengeId: 'c1',
        progress: 5,
        status: ChallengeStatus.CLAIMED,
        isCompleted: true,
      });

      await service.processUserActivity('user-1', 'COMMITS', 1);

      expect(prisma.userChallenge.update).not.toHaveBeenCalled();
    });
  });

  describe('claimChallengeReward verification & double-claim protection', () => {
    it('throws NotFoundException if userChallenge does not exist', async () => {
      prisma.userChallenge.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.claimChallengeReward('user-1', 'c-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if challenge reward was already claimed', async () => {
      prisma.userChallenge.findUnique.mockResolvedValueOnce({
        id: 'uc1',
        status: ChallengeStatus.CLAIMED,
        challenge: { title: 'Test Challenge', xpReward: 50 },
      });

      await expect(
        service.claimChallengeReward('user-1', 'c1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if challenge has not reached target', async () => {
      prisma.userChallenge.findUnique.mockResolvedValueOnce({
        id: 'uc1',
        status: ChallengeStatus.IN_PROGRESS,
        isCompleted: false,
        challenge: { title: 'Test Challenge', xpReward: 50 },
      });

      await expect(
        service.claimChallengeReward('user-1', 'c1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully claims reward: transitions status to CLAIMED and routes XP via XpService', async () => {
      const userChallenge = {
        id: 'uc1',
        userId: 'user-1',
        challengeId: 'c1',
        status: ChallengeStatus.COMPLETED,
        isCompleted: true,
        challenge: { title: 'Bug Hunter', xpReward: 150 },
      };
      prisma.userChallenge.findUnique.mockResolvedValueOnce(userChallenge);
      prisma.userChallenge.update.mockResolvedValueOnce({
        ...userChallenge,
        status: ChallengeStatus.CLAIMED,
        claimedAt: new Date(),
      });

      const res = await service.claimChallengeReward('user-1', 'c1');

      expect(res.success).toBe(true);
      expect(res.xpEarned).toBe(150);
      expect(prisma.userChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ChallengeStatus.CLAIMED }),
        }),
      );
      expect(xpService.addXp).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          amount: 150,
          source: 'CHALLENGE_CLAIM',
        }),
        expect.anything(),
      );
    });
  });

  describe('archiveExpiredChallenges archival engine', () => {
    it('updates in-progress user challenges of expired challenges to EXPIRED status', async () => {
      prisma.userChallenge.updateMany.mockResolvedValueOnce({ count: 7 });

      const result = await service.archiveExpiredChallenges();

      expect(result.expiredUserChallengesCount).toBe(7);
      expect(prisma.userChallenge.updateMany).toHaveBeenCalledWith({
        where: {
          status: ChallengeStatus.IN_PROGRESS,
          challenge: { expiresAt: { lte: expect.any(Date) } },
        },
        data: { status: ChallengeStatus.EXPIRED },
      });
    });
  });

  describe('ChallengesWorker job processing', () => {
    it('executes cleanup-expired-challenges job', async () => {
      const dlq = { capture: jest.fn() } as any;
      const worker = new ChallengesWorker(service, dlq);

      jest.spyOn(service, 'archiveExpiredChallenges').mockResolvedValueOnce({
        expiredUserChallengesCount: 5,
      });

      const res = await worker.process({
        name: 'cleanup-expired-challenges',
      } as any);

      expect(res).toEqual({ expiredUserChallengesCount: 5 });
      expect(service.archiveExpiredChallenges).toHaveBeenCalled();
    });
  });
});
