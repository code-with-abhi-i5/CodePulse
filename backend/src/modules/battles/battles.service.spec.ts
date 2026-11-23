import { BattlesService } from './battles.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BattlesService - ELO Rating Engine (#87)', () => {
  let battlesService: BattlesService;
  const mockPrisma = {} as PrismaService;

  beforeEach(() => {
    battlesService = new BattlesService(mockPrisma);
  });

  it('1. Standard Victory: calculates expected ELO point exchange between equally rated players', () => {
    const winnerRating = 1200;
    const loserRating = 1200;

    const outcome = battlesService.calculateElo(winnerRating, loserRating, 32);

    expect(outcome.winnerDelta).toBe(16);
    expect(outcome.loserDelta).toBe(-16);
    expect(outcome.winnerRating).toBe(1216);
    expect(outcome.loserRating).toBe(1184);
    expect(outcome.winnerXpGain).toBe(150);
    expect(outcome.loserXpGain).toBe(25);
  });

  it('2. Underdog Victory: awards higher ELO gain when lower-rated player defeats titan', () => {
    const underdogWinnerRating = 1000;
    const titanLoserRating = 1400;

    const outcome = battlesService.calculateElo(
      underdogWinnerRating,
      titanLoserRating,
      32,
    );

    // Winner was predicted to lose heavily (~9% chance), so delta should be significantly higher (> 25 pts)
    expect(outcome.winnerDelta).toBeGreaterThanOrEqual(28);
    expect(outcome.loserDelta).toBeLessThanOrEqual(-28);
    expect(outcome.winnerRating).toBe(1000 + outcome.winnerDelta);
    expect(outcome.loserRating).toBe(1400 + outcome.loserDelta);
  });

  it('3. Expected Favorite Victory: yields smaller ELO gain when higher-rated player wins', () => {
    const favoriteWinnerRating = 1500;
    const underdogLoserRating = 1100;

    const outcome = battlesService.calculateElo(
      favoriteWinnerRating,
      underdogLoserRating,
      32,
    );

    // Guaranteed minimum winner gain of at least 8 pts
    expect(outcome.winnerDelta).toBeGreaterThanOrEqual(8);
    expect(outcome.winnerRating).toBeGreaterThan(1500);
    expect(outcome.loserRating).toBeLessThan(1100);
  });

  it('4. Floors rating at 100 to prevent negative developer scores', () => {
    const winnerRating = 1200;
    const beginnerLoserRating = 105;

    const outcome = battlesService.calculateElo(
      winnerRating,
      beginnerLoserRating,
      32,
    );
    expect(outcome.loserRating).toBeGreaterThanOrEqual(100);
  });

  it('5. Plagiarism Protection (#315): nullifies Elo gains and losses when battle is flagged for plagiarism', async () => {
    const mockTx = {
      battleRating: {
        upsert: jest.fn(),
      },
      badge: {
        upsert: jest.fn(),
      },
      userBadge: {
        createMany: jest.fn(),
      },
      activity: {
        create: jest.fn(),
        createMany: jest.fn(),
      },
      developerRating: {
        upsert: jest.fn(),
      },
      notification: {
        createMany: jest.fn(),
      },
      battle: {
        update: jest.fn().mockResolvedValue({ id: 'b-1', status: 'COMPLETED', winnerId: 'p1' }),
      },
    };

    const prismaWithBattle: any = {
      battle: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'b-1',
          challengerId: 'p1',
          opponentId: 'p2',
          status: 'ACTIVE',
          flaggedForPlagiarism: true,
          similarityScore: 92.5,
          challenger: { username: 'alice' },
          opponent: { username: 'bob' },
        }),
      },
      developerRating: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      battleRating: {
        findUnique: jest.fn().mockResolvedValue({ elo: 1300, placementMatchesRemaining: 0 }),
      },
      $transaction: jest.fn().mockImplementation((cb: any) => cb(mockTx)),
    };

    const serviceWithPrisma = new BattlesService(prismaWithBattle);
    await serviceWithPrisma.updateBattleStatus('b-1', {
      status: 'COMPLETED',
      winnerId: 'p1',
    });

    // Rating upsert for winner must have 0 delta (rating remains 1300)
    expect(mockTx.battleRating.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'p1' },
        update: expect.objectContaining({
          elo: 1300,
        }),
      }),
    );
  });

  describe('Distributed Mutual Exclusion (Redlock #374)', () => {
    let redlock: any;
    let serviceWithRedlock: BattlesService;

    beforeEach(() => {
      redlock = {
        withMatchmakingLock: jest.fn().mockImplementation((fn) => fn({ resourceKey: 'lock:matchmaking:queue' })),
        withUserBalanceLock: jest.fn().mockImplementation((userId, fn) => fn({ resourceKey: `lock:user:balance:${userId}` })),
        withBattleRoomLock: jest.fn().mockImplementation((battleId, fn) => fn({ resourceKey: `lock:room:${battleId}` })),
      };

      serviceWithRedlock = new BattlesService(
        mockPrisma,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        redlock,
      );
    });

    it('enqueues and leaves matchmaking queue guarded by lock:matchmaking:queue', async () => {
      const joinRes = await serviceWithRedlock.joinMatchmakingQueue('user-mm-1', { elo: 1200 });
      expect(redlock.withMatchmakingLock).toHaveBeenCalled();
      expect(joinRes.status).toBe('QUEUED');
      expect(joinRes.userId).toBe('user-mm-1');

      const status = await serviceWithRedlock.getMatchmakingQueueStatus();
      expect(status.inQueueCount).toBe(1);

      const leaveRes = await serviceWithRedlock.leaveMatchmakingQueue('user-mm-1');
      expect(leaveRes.success).toBe(true);
    });

    it('places wager escrow guarded by lock:user:balance and lock:room', async () => {
      serviceWithRedlock.setUserBalance('user-wag-1', 500);

      const wager = await serviceWithRedlock.placeWager('user-wag-1', 'battle-101', 150);
      expect(redlock.withUserBalanceLock).toHaveBeenCalledWith('user-wag-1', expect.any(Function));
      expect(redlock.withBattleRoomLock).toHaveBeenCalledWith('battle-101', expect.any(Function));
      expect(wager.amount).toBe(150);
      expect(wager.remainingBalance).toBe(350);
      expect(wager.status).toBe('ESCROW');
    });

    it('settles wager and pays out 2x to winner guarded by distributed locks', async () => {
      serviceWithRedlock.setUserBalance('winner-1', 200);
      serviceWithRedlock.setUserBalance('loser-1', 200);

      const settlement = await serviceWithRedlock.settleWager('battle-202', 'winner-1', 'loser-1', 100);
      expect(redlock.withBattleRoomLock).toHaveBeenCalledWith('battle-202', expect.any(Function));
      expect(redlock.withUserBalanceLock).toHaveBeenCalledWith('winner-1', expect.any(Function));
      expect(settlement.payout).toBe(200);
      expect(settlement.winnerNewBalance).toBe(400);
      expect(settlement.status).toBe('PAID_OUT');
    });
  });
});
