import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { XpVelocityGovernorService } from './xp-velocity-governor.service';
import { XpAnomalyDetectorService } from './xp-anomaly-detector.service';
import { XpClawbackService } from './xp-clawback.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LevelsService } from '../levels/levels.service';
import { FraudAlertStatus } from '@prisma/client';

describe('Xp Velocity Governor & Fraud Clawback (#6800)', () => {
  let governor: XpVelocityGovernorService;
  let detector: XpAnomalyDetectorService;
  let clawback: XpClawbackService;

  const mockPrismaService: any = {
    xpDailyAccrual: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    xpFraudAlert: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    developerRating: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    xpTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any): any => callback(mockPrismaService)),
    $queryRaw: jest.fn().mockResolvedValue([]),
  };

  const mockLevelsService = {
    checkAndLevelUp: jest.fn().mockResolvedValue({
      level: 10,
      tier: 'GOLD',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpVelocityGovernorService,
        XpAnomalyDetectorService,
        XpClawbackService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LevelsService, useValue: mockLevelsService },
      ],
    }).compile();

    governor = module.get<XpVelocityGovernorService>(XpVelocityGovernorService);
    detector = module.get<XpAnomalyDetectorService>(XpAnomalyDetectorService);
    clawback = module.get<XpClawbackService>(XpClawbackService);
  });

  describe('XpVelocityGovernorService', () => {
    it('should allow valid transaction within daily quota and compute remaining allowance', async () => {
      mockPrismaService.xpDailyAccrual.upsert.mockResolvedValue({
        gamificationXp: 350,
        githubXp: 0,
        totalXp: 350,
      });

      const result = await governor.checkAndRecordVelocity('user-1', 350, 'DAILY_CHALLENGE');

      expect(result.allowed).toBe(true);
      expect(result.remainingDailyQuota).toBe(2150); // 2500 - 350
      expect(result.flaggedAnomaly).toBe(false);
      expect(result.anomalyScore).toBe(1.0);
    });

    it('should flag an anomaly when a single transaction exceeds 500 XP', async () => {
      mockPrismaService.xpDailyAccrual.upsert.mockResolvedValue({
        gamificationXp: 1200,
        githubXp: 0,
        totalXp: 1200,
      });

      const result = await governor.checkAndRecordVelocity('user-1', 1200, 'MANUAL_GRANT');

      expect(result.allowed).toBe(true);
      expect(result.flaggedAnomaly).toBe(true);
      expect(result.anomalyScore).toBe(2.4); // 1200 / 500
    });

    it('should throw 429 TooManyRequests when daily gamification ceiling (2500 XP) is breached', async () => {
      mockPrismaService.xpDailyAccrual.upsert.mockResolvedValue({
        gamificationXp: 2800,
        githubXp: 0,
        totalXp: 2800,
      });

      await expect(
        governor.checkAndRecordVelocity('user-spammer', 500, 'CHALLENGE_FARM'),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
        }),
      );
    });
  });

  describe('XpAnomalyDetectorService', () => {
    it('should record an anomaly alert into the fraud ledger', async () => {
      mockPrismaService.xpFraudAlert.create.mockResolvedValue({
        id: 'alert-1',
        userId: 'user-suspicious',
        flaggedAmount: 2000,
        source: 'EXPLOIT_TEST',
        reason: 'Velocity burst',
        anomalyScore: 4.0,
        status: FraudAlertStatus.FLAGGED,
      });

      const alert = await detector.recordFraudAlert({
        userId: 'user-suspicious',
        amount: 2000,
        source: 'EXPLOIT_TEST',
        reason: 'Velocity burst',
        anomalyScore: 4.0,
      });

      expect(alert.id).toBe('alert-1');
      expect(alert.status).toBe(FraudAlertStatus.FLAGGED);
      expect(mockPrismaService.xpFraudAlert.create).toHaveBeenCalled();
    });
  });

  describe('XpClawbackService', () => {
    it('should execute atomic clawback, reverse XP, append audit entry, and update levels', async () => {
      mockPrismaService.developerRating.findUnique.mockResolvedValue({
        userId: 'user-cheater',
        xp: 5000,
        gamificationXp: 3000,
        level: 12,
        tier: 'PLATINUM',
      });

      mockPrismaService.developerRating.update.mockResolvedValue({
        userId: 'user-cheater',
        xp: 3500,
        gamificationXp: 1500,
        level: 9,
        tier: 'GOLD',
      });

      mockPrismaService.xpTransaction.create.mockResolvedValue({
        id: 'tx-clawback-1',
        amount: -1500,
        source: 'ADMIN_CLAWBACK',
      });

      mockPrismaService.xpFraudAlert.update.mockResolvedValue({
        id: 'alert-1',
        status: FraudAlertStatus.CLAWED_BACK,
      });

      const result = await clawback.executeClawback('admin-master', {
        userId: 'user-cheater',
        amount: 1500,
        reason: 'Bot macro farming in daily challenges',
        fraudAlertId: 'alert-1',
      });

      expect(result.success).toBe(true);
      expect(result.clawedBackAmount).toBe(1500);
      expect(result.remainingXp).toBe(3500);
      expect(mockPrismaService.xpTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: -1500,
            source: 'ADMIN_CLAWBACK',
          }),
        }),
      );
      expect(mockLevelsService.checkAndLevelUp).toHaveBeenCalled();
    });
  });
});
