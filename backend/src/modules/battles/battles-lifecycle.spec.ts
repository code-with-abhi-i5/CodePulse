import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BattlesLifecycleWorker } from './battles-lifecycle.worker';

describe('Battles Lifecycle State Machine & Expiration Engine', () => {
  let service: BattlesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      battle: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      developerRating: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      battleRating: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      activity: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      notification: {
        createMany: jest.fn(),
      },
      badge: {
        upsert: jest.fn(),
      },
      userBadge: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    service = new BattlesService(prisma as unknown as PrismaService);
  });

  describe('createBattle lifecycle validations', () => {
    it('rejects battle creation if challenger is the same as opponent', async () => {
      await expect(
        service.createBattle({
          challengerId: 'user-1',
          opponentId: 'user-1',
          category: 'algorithms',
          endsAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects battle creation if endsAt is in the past', async () => {
      await expect(
        service.createBattle({
          challengerId: 'user-1',
          opponentId: 'user-2',
          category: 'algorithms',
          endsAt: new Date(Date.now() - 3600000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects battle creation if challenger or opponent does not exist', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // Challenger missing

      await expect(
        service.createBattle({
          challengerId: 'nonexistent-1',
          opponentId: 'user-2',
          category: 'algorithms',
          endsAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects battle creation if either participant already has an active battle', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({ id: 'user-2' });
      prisma.battle.findFirst.mockResolvedValueOnce({ id: 'existing-battle-1' });

      await expect(
        service.createBattle({
          challengerId: 'user-1',
          opponentId: 'user-2',
          category: 'algorithms',
          endsAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully creates a battle with future endsAt date', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', username: 'alice' })
        .mockResolvedValueOnce({ id: 'user-2', username: 'bob' });
      prisma.battle.findFirst.mockResolvedValueOnce(null);
      prisma.battle.create.mockResolvedValueOnce({
        id: 'new-battle',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'PENDING',
        endsAt: futureDate,
      });

      const result = await service.createBattle({
        challengerId: 'user-1',
        opponentId: 'user-2',
        category: 'algorithms',
        endsAt: futureDate.toISOString(),
      });

      expect(result.id).toBe('new-battle');
      expect(prisma.battle.create).toHaveBeenCalled();
    });
  });

  describe('getActiveBattles', () => {
    it('queries active battles where endsAt is greater than current timestamp', async () => {
      prisma.battle.findMany.mockResolvedValueOnce([]);

      await service.getActiveBattles();

      expect(prisma.battle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            endsAt: expect.objectContaining({ gt: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('updateBattleStatus participant authorization and terminal states', () => {
    it('throws ForbiddenException if non-participant tries to update battle status', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce({
        id: 'battle-1',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'ACTIVE',
      });

      await expect(
        service.updateBattleStatus(
          'battle-1',
          { status: 'CANCELLED' as any },
          'stranger-user-3',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when modifying a battle in terminal status', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce({
        id: 'battle-1',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'EXPIRED',
      });

      await expect(
        service.updateBattleStatus(
          'battle-1',
          { status: 'ACTIVE' as any },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows marking battle as EXPIRED with reason', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce({
        id: 'battle-1',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'ACTIVE',
      });
      prisma.battle.update.mockResolvedValueOnce({
        id: 'battle-1',
        status: 'EXPIRED',
      });

      const res = await service.updateBattleStatus(
        'battle-1',
        { status: 'EXPIRED' as any, cancellationReason: 'Timeout' },
        'user-1',
      );

      expect(prisma.battle.update).toHaveBeenCalledWith({
        where: { id: 'battle-1' },
        data: {
          status: 'EXPIRED',
          cancellationReason: 'Timeout',
        },
      });
    });
  });

  describe('forfeitBattle', () => {
    it('throws NotFoundException if battle does not exist', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.forfeitBattle('unknown', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if non-participant forfeits', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce({
        id: 'battle-1',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'ACTIVE',
      });

      await expect(
        service.forfeitBattle('battle-1', 'user-999'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cancels pending battle on forfeit without rating penalty', async () => {
      prisma.battle.findUnique.mockResolvedValueOnce({
        id: 'battle-pending',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'PENDING',
      });
      prisma.battle.update.mockResolvedValueOnce({
        id: 'battle-pending',
        status: 'FORFEITED',
      });

      await service.forfeitBattle('battle-pending', 'user-1', 'Declined challenge');

      expect(prisma.battle.update).toHaveBeenCalledWith({
        where: { id: 'battle-pending' },
        data: {
          status: 'FORFEITED',
          forfeitedById: 'user-1',
          cancellationReason: 'Declined challenge',
        },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('processes forfeit for active match: awards victory to opponent, updates ratings and logs notifications', async () => {
      const activeBattle = {
        id: 'battle-active',
        challengerId: 'user-1',
        opponentId: 'user-2',
        status: 'ACTIVE',
        challenger: { username: 'alice' },
        opponent: { username: 'bob' },
      };
      prisma.battle.findUnique.mockResolvedValueOnce(activeBattle);
      prisma.developerRating.findUnique
        .mockResolvedValueOnce({ userId: 'user-2', xp: 500, level: 2, xpToNextLevel: 1500 }) // winner
        .mockResolvedValueOnce({ userId: 'user-1', xp: 300, level: 1, xpToNextLevel: 1000 }); // loser
      prisma.battleRating.findUnique
        .mockResolvedValueOnce({ userId: 'user-2', elo: 1200, placementMatchesRemaining: 3 })
        .mockResolvedValueOnce({ userId: 'user-1', elo: 1200, placementMatchesRemaining: 3 });
      prisma.battle.update.mockResolvedValueOnce({
        id: 'battle-active',
        status: 'FORFEITED',
        winnerId: 'user-2',
      });

      const res = await service.forfeitBattle('battle-active', 'user-1', 'Player resigned');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.battleRating.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.developerRating.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-2', type: 'BATTLE' }),
          expect.objectContaining({ userId: 'user-1', type: 'BATTLE' }),
        ]),
      });
      expect(prisma.activity.createMany).toHaveBeenCalled();
      expect(prisma.battle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'battle-active' },
          data: expect.objectContaining({
            status: 'FORFEITED',
            winnerId: 'user-2',
            forfeitedById: 'user-1',
            cancellationReason: 'Player resigned',
          }),
        }),
      );
    });
  });

  describe('expireStaleBattles worker engine', () => {
    it('expires pending challenges older than 24h and resolves expired active battles', async () => {
      prisma.battle.updateMany.mockResolvedValueOnce({ count: 4 }); // 4 pending expired
      prisma.battle.findMany.mockResolvedValueOnce([
        {
          id: 'active-1',
          challengerId: 'c1',
          opponentId: 'o1',
          challengerScore: 10,
          opponentScore: 5,
          status: 'ACTIVE',
        },
        {
          id: 'active-2',
          challengerId: 'c2',
          opponentId: 'o2',
          challengerScore: 0,
          opponentScore: 0,
          status: 'ACTIVE',
        },
      ]);

      const forfeitSpy = jest
        .spyOn(service, 'forfeitBattle')
        .mockResolvedValueOnce({} as any);

      const result = await service.expireStaleBattles();

      expect(result.expiredCount).toBe(5); // 4 pending + 1 tie expired
      expect(result.forfeitedCount).toBe(1); // active-1 opponent forfeited
      expect(forfeitSpy).toHaveBeenCalledWith(
        'active-1',
        'o1',
        expect.stringContaining('Auto-forfeited'),
      );
      expect(prisma.battle.update).toHaveBeenCalledWith({
        where: { id: 'active-2' },
        data: {
          status: 'EXPIRED',
          cancellationReason: 'Battle expired without decisive winner',
        },
      });
    });
  });

  describe('BattlesLifecycleWorker', () => {
    it('calls expireStaleBattles when processing cleanup-expired-battles job', async () => {
      const worker = new BattlesLifecycleWorker(service);
      jest.spyOn(service, 'expireStaleBattles').mockResolvedValueOnce({
        expiredCount: 3,
        forfeitedCount: 1,
      });

      const res = await worker.process({ name: 'cleanup-expired-battles' } as any);

      expect(res).toEqual({ expiredCount: 3, forfeitedCount: 1 });
      expect(service.expireStaleBattles).toHaveBeenCalled();
    });

    it('throws error for unknown job name', async () => {
      const worker = new BattlesLifecycleWorker(service);
      await expect(
        worker.process({ name: 'unknown-job' } as any),
      ).rejects.toThrow('Unknown battle lifecycle job: unknown-job');
    });
  });
});
