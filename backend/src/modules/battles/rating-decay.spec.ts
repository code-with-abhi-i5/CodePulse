import { BattleRating, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { RatingDecayScheduler } from './rating-decay.scheduler';
import { RatingDecayService } from './rating-decay.service';
import { decayAmount, decayFloorForElo, dueDecayPeriods } from './rating-decay';

function rating(overrides: Partial<BattleRating> = {}): BattleRating {
  return {
    userId: 'player-1',
    elo: 2125,
    placementMatchesRemaining: 0,
    seasonNumber: 1,
    version: 1,
    lastBattleAt: new Date('2026-10-26T00:00:00Z'),
    decayPeriodsApplied: 0,
    decayFloor: 1800,
    decayWarnedFor: null,
    updatedAt: new Date('2026-10-26T00:00:00Z'),
    ...overrides,
  };
}

function fixture(players: BattleRating[]) {
  const tx = {
    battleRating: {
      updateMany: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({ count: 1 });
      }),
    },
    xpTransaction: {
      create: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
    notification: {
      create: jest.fn((args: unknown) => {
        void args;
        return Promise.resolve({});
      }),
    },
  };
  const prisma = {
    battleRating: { findMany: jest.fn().mockResolvedValue(players) },
    $transaction: jest.fn((work: (client: typeof tx) => Promise<unknown>) =>
      work(tx),
    ),
  };
  return {
    service: new RatingDecayService(prisma as unknown as PrismaService),
    prisma,
    tx,
  };
}

describe('competitive rating decay', () => {
  it('schedules UTC Monday deductions and Saturday warnings via BullMQ', async () => {
    const upsertJobScheduler = jest.fn((...args: unknown[]) => {
      void args;
      return Promise.resolve(undefined);
    });
    const scheduler = new RatingDecayScheduler({
      upsertJobScheduler,
    } as unknown as Queue);
    await scheduler.onModuleInit();
    expect(upsertJobScheduler.mock.calls[0][0]).toBe('weekly-rating-decay');
    expect(upsertJobScheduler.mock.calls[0][1]).toEqual({
      pattern: '0 0 0 * * 1',
      tz: 'UTC',
    });
    expect(upsertJobScheduler.mock.calls[1][0]).toBe('rating-decay-warning');
    expect(upsertJobScheduler.mock.calls[1][1]).toEqual({
      pattern: '0 0 0 * * 6',
      tz: 'UTC',
    });
  });

  it('preserves the last-battle tier floor and ignores low-tier players', () => {
    expect(decayFloorForElo(1799)).toBeNull();
    expect(decayFloorForElo(1800)).toBe(1500);
    expect(decayFloorForElo(2100)).toBe(1800);
    expect(decayFloorForElo(2400)).toBe(1800);
    expect(decayAmount(1810, 1800, 4, 0)).toBe(10);
  });

  it('charges once after 14 inactive days, then one period per week', () => {
    const last = new Date('2026-10-26T00:00:00Z');
    expect(dueDecayPeriods(last, new Date('2026-11-08T23:59:59Z'))).toBe(0);
    expect(dueDecayPeriods(last, new Date('2026-11-09T00:00:00Z'))).toBe(1);
    expect(dueDecayPeriods(last, new Date('2026-11-16T00:00:00Z'))).toBe(2);
  });

  it('deducts missed weekly periods atomically and logs Elo without changing XP', async () => {
    const { service, tx } = fixture([rating()]);
    expect(await service.runDecay(new Date('2026-11-17T00:00:00Z'))).toBe(1);
    expect(tx.battleRating.updateMany.mock.calls[0][0]).toMatchObject({
      where: {
        userId: 'player-1',
        decayPeriodsApplied: 0,
      },
      data: { elo: 2075, decayPeriodsApplied: 2 },
    });
    expect(tx.xpTransaction.create.mock.calls[0][0]).toMatchObject({
      data: {
        source: 'RATING_DECAY',
        amount: 0,
      },
    });
  });

  it('never re-applies a period or charges an inactive low-tier player', async () => {
    const { service, prisma } = fixture([
      rating({ elo: 2075, decayPeriodsApplied: 2 }),
      rating({ userId: 'player-2', elo: 1700, decayFloor: null }),
    ]);
    expect(await service.runDecay(new Date('2026-11-17T00:00:00Z'))).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not log a duplicate transaction after a concurrent worker wins', async () => {
    const { service, tx } = fixture([rating()]);
    tx.battleRating.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await service.runDecay(new Date('2026-11-17T00:00:00Z'))).toBe(0);
    expect(tx.xpTransaction.create).not.toHaveBeenCalled();
  });

  it('sends one 48-hour warning for the next UTC Monday decay', async () => {
    const { service, tx } = fixture([rating()]);
    expect(await service.sendWarnings(new Date('2026-11-14T00:00:00Z'))).toBe(
      1,
    );
    expect(tx.battleRating.updateMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 'player-1' },
      data: { decayWarnedFor: new Date('2026-11-16T00:00:00Z') },
    });
    expect(tx.notification.create.mock.calls[0][0]).toMatchObject({
      data: {
        type: NotificationType.SYSTEM,
        metadata: { scheduledFor: '2026-11-16T00:00:00.000Z', deduction: 50 },
      },
    });
  });

  it('skips a warning already sent for that Monday', async () => {
    const { service, prisma } = fixture([
      rating({ decayWarnedFor: new Date('2026-11-16T00:00:00Z') }),
    ]);
    expect(await service.sendWarnings(new Date('2026-11-14T00:00:00Z'))).toBe(
      0,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  describe('Anti-Smurf Placement Calibration for Returning Players', () => {
    it('accelerates MMR gains for decayed veteran players to avoid smurfing low tiers', () => {
      const { service } = fixture([]);
      const calibration = service.calibrateReturningPlayerPlacement('veteran-1', 1550, 2100, 25);
      expect(calibration.antiSmurfAction).toBe('ACCELERATED_RETURN');
      expect(calibration.provisionalMultiplier).toBeGreaterThanOrEqual(2.0);
      expect(calibration.calibratedEloGain).toBeGreaterThan(50);
      expect(calibration.reason).toContain('Returning veteran deficit');
    });

    it('retains standard gain when player is near their skill bracket', () => {
      const { service } = fixture([]);
      const calibration = service.calibrateReturningPlayerPlacement('regular-1', 1800, 1900, 25);
      expect(calibration.antiSmurfAction).toBe('STANDARD');
      expect(calibration.provisionalMultiplier).toBe(1.0);
      expect(calibration.calibratedEloGain).toBe(25);
    });
  });
});
