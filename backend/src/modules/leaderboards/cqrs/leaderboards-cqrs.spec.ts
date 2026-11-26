import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from './core/command-bus';
import { QueryBus } from './core/query-bus';
import { EventBus } from './core/event-bus';
import { RecordMatchResultCommand } from './commands/record-match-result.command';
import { RecordMatchResultCommandHandler } from './commands/record-match-result.handler';
import { SyncUserCommitsCommand } from './commands/sync-user-commits.command';
import { SyncUserCommitsCommandHandler } from './commands/sync-user-commits.handler';
import { GetTopDevelopersQuery } from './queries/get-top-developers.query';
import { GetTopDevelopersQueryHandler } from './queries/get-top-developers.handler';
import { GetCountryLeaderboardQuery } from './queries/get-country-leaderboard.query';
import { GetCountryLeaderboardQueryHandler } from './queries/get-country-leaderboard.handler';
import { MatchResultRecordedEvent } from './events/match-result-recorded.event';
import { UserCommitsSyncedEvent } from './events/user-commits-synced.event';
import { MatchResultProjector } from './projectors/match-result.projector';
import { UserCommitsProjector } from './projectors/user-commits.projector';
import { RedisZsetProjectorService } from './projectors/redis-zset-projector.service';
import { LeaderboardReconcilerService } from './reconciler/leaderboard-reconciler.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('Leaderboard CQRS Architecture & Self-Healing Reconciler', () => {
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let eventBus: EventBus;
  let redisProjector: RedisZsetProjectorService;
  let reconciler: LeaderboardReconcilerService;
  let mockPrisma: any;

  // In-memory mock database state for Postgres write-master
  let mockDbUsers: Map<string, any>;
  let mockDbRatings: Map<string, any>;
  let mockDbStats: Map<string, any>;
  let mockDbBattles: Map<string, any>;

  beforeEach(async () => {
    mockDbUsers = new Map();
    mockDbRatings = new Map();
    mockDbStats = new Map();
    mockDbBattles = new Map();

    // Populate initial write-master test data
    mockDbUsers.set('user-alice', {
      id: 'user-alice',
      username: 'alice_codes',
      name: 'Alice Developer',
      location: 'India',
    });
    mockDbRatings.set('user-alice', {
      userId: 'user-alice',
      overall: 1200,
      xp: 1200,
    });
    mockDbStats.set('user-alice', {
      userId: 'user-alice',
      totalCommits: 150,
      contributions: 150,
    });

    mockDbUsers.set('user-bob', {
      id: 'user-bob',
      username: 'bob_builder',
      name: 'Bob Systems',
      location: 'United States',
    });
    mockDbRatings.set('user-bob', {
      userId: 'user-bob',
      overall: 1150,
      xp: 1150,
    });
    mockDbStats.set('user-bob', {
      userId: 'user-bob',
      totalCommits: 90,
      contributions: 90,
    });

    mockPrisma = {
      $transaction: jest.fn(async (callback: any) => {
        const tx = {
          developerRating: {
            findUnique: jest.fn(async ({ where }: any) => mockDbRatings.get(where.userId) || null),
            update: jest.fn(async ({ where, data }: any) => {
              const existing = mockDbRatings.get(where.userId) || { overall: 0, xp: 0 };
              const incOverall = data.overall?.increment ?? 0;
              const incXp = data.xp?.increment ?? 0;
              const decXp = data.xp?.decrement ?? 0;
              const updated = {
                ...existing,
                overall: data.overall !== undefined && typeof data.overall === 'number'
                  ? data.overall
                  : existing.overall + incOverall,
                xp: existing.xp + incXp - decXp,
              };
              mockDbRatings.set(where.userId, updated);
              return updated;
            }),
            create: jest.fn(async ({ data }: any) => {
              mockDbRatings.set(data.userId, data);
              return data;
            }),
            upsert: jest.fn(async ({ where, create, update }: any) => {
              const existing = mockDbRatings.get(where.userId);
              if (existing) {
                const updated = {
                  ...existing,
                  overall: existing.overall + (update.overall?.increment || 0),
                  xp: existing.xp + (update.xp?.increment || 0),
                };
                mockDbRatings.set(where.userId, updated);
                return updated;
              } else {
                mockDbRatings.set(where.userId, create);
                return create;
              }
            }),
            findMany: jest.fn(async () => {
              return Array.from(mockDbRatings.values()).map((r) => {
                const u = mockDbUsers.get(r.userId);
                const s = mockDbStats.get(r.userId);
                return {
                  ...r,
                  user: u ? { ...u, stats: s } : null,
                };
              });
            }),
          },
          developerStats: {
            upsert: jest.fn(async ({ where, create, update }: any) => {
              const existing = mockDbStats.get(where.userId);
              if (existing) {
                const updated = {
                  ...existing,
                  totalCommits: existing.totalCommits + (update.totalCommits?.increment || 0),
                  contributions: existing.contributions + (update.contributions?.increment || 0),
                };
                mockDbStats.set(where.userId, updated);
                return updated;
              } else {
                mockDbStats.set(where.userId, create);
                return create;
              }
            }),
          },
          user: {
            findUnique: jest.fn(async ({ where }: any) => mockDbUsers.get(where.id) || null),
            update: jest.fn(async ({ where, data }: any) => {
              const user = mockDbUsers.get(where.id) || {};
              const updated = { ...user, ...data };
              mockDbUsers.set(where.id, updated);
              return updated;
            }),
          },
          battle: {
            upsert: jest.fn(async ({ create }: any) => {
              mockDbBattles.set(create.id, create);
              return create;
            }),
          },
          githubUser: {
            findUnique: jest.fn(async () => null),
            findFirst: jest.fn(async () => null),
            update: jest.fn(async () => ({})),
            findMany: jest.fn(async () => []),
          },
        };
        return callback(tx);
      }),
      developerRating: {
        findMany: jest.fn(async () => {
          return Array.from(mockDbRatings.values()).map((r) => {
            const u = mockDbUsers.get(r.userId);
            const s = mockDbStats.get(r.userId);
            return {
              ...r,
              user: u ? { ...u, stats: s } : null,
            };
          });
        }),
      },
      githubUser: {
        findMany: jest.fn(async () => []),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandBus,
        QueryBus,
        EventBus,
        RedisZsetProjectorService,
        LeaderboardReconcilerService,
        RecordMatchResultCommandHandler,
        SyncUserCommitsCommandHandler,
        GetTopDevelopersQueryHandler,
        GetCountryLeaderboardQueryHandler,
        MatchResultProjector,
        UserCommitsProjector,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    eventBus = module.get<EventBus>(EventBus);
    redisProjector = module.get<RedisZsetProjectorService>(RedisZsetProjectorService);
    reconciler = module.get<LeaderboardReconcilerService>(LeaderboardReconcilerService);

    // Register handlers
    commandBus.register(RecordMatchResultCommand, module.get(RecordMatchResultCommandHandler));
    commandBus.register(SyncUserCommitsCommand, module.get(SyncUserCommitsCommandHandler));
    queryBus.register(GetTopDevelopersQuery, module.get(GetTopDevelopersQueryHandler));
    queryBus.register(GetCountryLeaderboardQuery, module.get(GetCountryLeaderboardQueryHandler));
    eventBus.register(MatchResultRecordedEvent, module.get(MatchResultProjector));
    eventBus.register(UserCommitsSyncedEvent, module.get(UserCommitsProjector));
  });

  afterEach(() => {
    redisProjector.clear();
  });

  describe('Commands & Postgres Transactional Integrity', () => {
    it('executes RecordMatchResultCommand transactionally on Postgres and emits MatchResultRecordedEvent', async () => {
      const matchCommand = new RecordMatchResultCommand(
        'match-101',
        'user-alice',
        'user-bob',
        50, // Alice gains 50
        -20, // Bob loses 20
        '1v1_RANKED',
      );

      const result = await commandBus.execute(matchCommand);

      expect(result.success).toBe(true);
      expect(result.matchId).toBe('match-101');
      expect(result.winnerNewScore).toBe(1250); // 1200 + 50
      expect(result.loserNewScore).toBe(1130); // 1150 - 20
      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // Check that Redis Read Model ZSET was updated asynchronously via Event Projector
      const globalKey = redisProjector.getGlobalRatingKey();
      const aliceScore = await redisProjector.zScore(globalKey, 'user-alice');
      const bobScore = await redisProjector.zScore(globalKey, 'user-bob');

      expect(aliceScore).toBe(1250);
      expect(bobScore).toBe(1130);

      // Check Country ZSET projection
      const indiaKey = redisProjector.getCountryRatingKey('India');
      const aliceCountryScore = await redisProjector.zScore(indiaKey, 'user-alice');
      expect(aliceCountryScore).toBe(1250);
    });

    it('executes SyncUserCommitsCommand transactionally on Postgres and projects into Redis ZSET', async () => {
      const syncCommand = new SyncUserCommitsCommand(
        'user-alice',
        25, // 25 new commits -> +250 XP
        500,
        'CodePulse/engine',
        'India',
      );

      const result = await commandBus.execute(syncCommand);

      expect(result.success).toBe(true);
      expect(result.totalCommits).toBe(175); // 150 + 25
      expect(result.updatedScore).toBe(1450); // 1200 + 250
      expect(mockPrisma.$transaction).toHaveBeenCalled();

      // Verify Redis Commits & Rating ZSET projections
      const commitsKey = redisProjector.getGlobalCommitsKey();
      const aliceCommits = await redisProjector.zScore(commitsKey, 'user-alice');
      expect(aliceCommits).toBe(175);

      const ratingKey = redisProjector.getGlobalRatingKey();
      const aliceRating = await redisProjector.zScore(ratingKey, 'user-alice');
      expect(aliceRating).toBe(1450);
    });
  });

  describe('High-Performance Queries (< 5ms SLA from Redis Read Model)', () => {
    beforeEach(async () => {
      // Seed Redis ZSET Read Model with 10 developers directly
      const globalRatingKey = redisProjector.getGlobalRatingKey();
      const indiaRatingKey = redisProjector.getCountryRatingKey('India');

      for (let i = 1; i <= 10; i++) {
        const id = `dev-${i}`;
        const score = 2000 - i * 100;
        await redisProjector.zAdd(globalRatingKey, score, id);
        await redisProjector.setUserMetadata(id, {
          username: `coder_${i}`,
          name: `Developer ${i}`,
          country: i % 2 === 0 ? 'India' : 'US',
        });

        if (i % 2 === 0) {
          await redisProjector.zAdd(indiaRatingKey, score, id);
        }
      }
    });

    it('serves GetTopDevelopersQuery from Redis ZSET in < 5ms without touching PostgreSQL', async () => {
      const query = new GetTopDevelopersQuery(5, 0, 'rating');

      const start = performance.now();
      const result = await queryBus.execute(query);
      const duration = performance.now() - start;

      // Assert < 5ms execution SLA
      expect(duration).toBeLessThan(5);
      expect(result.latencyMs).toBeLessThan(5);
      expect(result.source).toBe('redis_zset_read_model');
      expect(result.total).toBe(10);
      expect(result.data).toHaveLength(5);

      // Verify rankings order & metadata
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].userId).toBe('dev-1');
      expect(result.data[0].score).toBe(1900);
      expect(result.data[1].rank).toBe(2);
      expect(result.data[1].score).toBe(1800);

      // Verify PostgreSQL was NOT touched during query execution!
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('serves GetCountryLeaderboardQuery for specific country from Redis ZSET in < 5ms', async () => {
      const query = new GetCountryLeaderboardQuery('India', 5, 0, 'rating');

      const start = performance.now();
      const result = await queryBus.execute(query);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
      expect(result.latencyMs).toBeLessThan(5);
      expect(result.country).toBe('India');
      expect(result.total).toBe(5); // dev-2, dev-4, dev-6, dev-8, dev-10
      expect(result.data[0].userId).toBe('dev-2');
      expect(result.data[0].score).toBe(1800);
      expect(result.data[0].rank).toBe(1);
    });
  });

  describe('Self-Healing Hourly Reconciler (Drift Detection & Repair)', () => {
    it('detects and repairs state drift between Postgres write-master and Redis read model', async () => {
      const globalRatingKey = redisProjector.getGlobalRatingKey();

      // Alice: in Postgres with 1200, but in Redis with drifted 1100
      await redisProjector.zAdd(globalRatingKey, 1100, 'user-alice');

      // Bob: in Postgres with 1150, but entirely missing in Redis
      // (do not add Bob to Redis)

      // Charlie: orphaned in Redis with 900, but not in Postgres
      await redisProjector.zAdd(globalRatingKey, 900, 'user-charlie-orphan');

      // Run Reconciler
      const auditReport = await reconciler.reconcileLeaderboards();

      expect(auditReport.status).toBe('DRIFT_REPAIRED');
      expect(auditReport.driftsFound).toBe(3); // Alice score drift, Bob missing, Charlie orphan
      expect(auditReport.repairedCount).toBe(3);

      // Verify self-healed Redis ZSET state:
      // Alice is repaired to 1200
      const aliceScore = await redisProjector.zScore(globalRatingKey, 'user-alice');
      expect(aliceScore).toBe(1200);

      // Bob is added to Redis with 1150
      const bobScore = await redisProjector.zScore(globalRatingKey, 'user-bob');
      expect(bobScore).toBe(1150);

      // Charlie orphan is removed from Redis
      const charlieScore = await redisProjector.zScore(globalRatingKey, 'user-charlie-orphan');
      expect(charlieScore).toBeNull();

      // Subsequent reconciliation should confirm IN_SYNC state with 0 drifts!
      const secondAudit = await reconciler.reconcileLeaderboards();
      expect(secondAudit.status).toBe('IN_SYNC');
      expect(secondAudit.driftsFound).toBe(0);
      expect(secondAudit.repairedCount).toBe(0);
    });
  });
});
