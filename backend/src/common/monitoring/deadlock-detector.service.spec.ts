import { Test, TestingModule } from '@nestjs/testing';
import {
  DeadlockDetectorService,
  BlockedTransaction,
  IDeadlockDatabaseAdapter,
} from './deadlock-detector.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DeadlockDetectorService', () => {
  let service: DeadlockDetectorService;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    mockPrisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlockDetectorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DeadlockDetectorService>(DeadlockDetectorService);
  });

  afterEach(() => {
    service.stopDetector();
  });

  it('should correctly classify query priority based on query content', () => {
    expect(
      service.classifyQueryPriority(
        'UPDATE "DeveloperRating" SET rating = 1500 WHERE id = 1',
      ),
    ).toBe('HIGH_INTERACTIVE');

    expect(
      service.classifyQueryPriority(
        'UPDATE "Battle" SET status = "ACTIVE" WHERE id = 2',
      ),
    ).toBe('HIGH_INTERACTIVE');

    expect(
      service.classifyQueryPriority(
        'INSERT INTO "github_sync_jobs" VALUES (1, 2)',
      ),
    ).toBe('LOW_BACKGROUND');

    expect(
      service.classifyQueryPriority('SELECT * FROM settings WHERE id = 1'),
    ).toBe('MEDIUM');
  });

  it('should detect cyclical wait-for graphs and identify lowest-priority victim transaction', () => {
    const cyclicalTransactions: BlockedTransaction[] = [
      // Interactive Battle query waiting for PID 5002
      {
        blockedPid: 5001,
        blockingPid: 5002,
        blockedQuery: 'UPDATE "Battle" SET score = 100 WHERE id = 10',
        blockingQuery: 'UPDATE "github_sync_job" SET state = "running"',
        blockedDurationMs: 3500,
        tableName: 'Battle',
        lockType: 'transactionid',
        mode: 'ExclusiveLock',
        isInteractiveUserQuery: true,
        isBackgroundWorkerQuery: false,
        priority: 'HIGH_INTERACTIVE',
      },
      // Low priority background sync query waiting for PID 5001 (forming cycle 5001 <-> 5002)
      {
        blockedPid: 5002,
        blockingPid: 5001,
        blockedQuery: 'UPDATE "github_sync_job" SET state = "running"',
        blockingQuery: 'UPDATE "Battle" SET score = 100 WHERE id = 10',
        blockedDurationMs: 4000,
        tableName: 'github_sync_job',
        lockType: 'relation',
        mode: 'ShareLock',
        isInteractiveUserQuery: false,
        isBackgroundWorkerQuery: true,
        priority: 'LOW_BACKGROUND',
      },
    ];

    const cycles = service.findDeadlockCycles(cyclicalTransactions);
    expect(cycles.length).toBe(1);
    expect(cycles[0].cyclePids).toEqual([5001, 5002]);

    // Lowest priority victim must be the background worker (PID 5002)
    expect(cycles[0].victimPid).toBe(5002);
  });

  it('should automatically terminate lowest-priority victim to resolve deadlocks and record post-mortem', async () => {
    const terminateSpy = jest.fn().mockResolvedValue(true);
    const mockDbAdapter: IDeadlockDatabaseAdapter = {
      queryLockContention: jest.fn().mockResolvedValue([
        {
          blockedPid: 6001,
          blockingPid: 6002,
          blockedQuery:
            'UPDATE "DeveloperRating" SET elo = 2100 WHERE user_id = 42',
          blockingQuery: 'UPDATE "analytics_aggregate_table" SET count = 50',
          blockedDurationMs: 3200,
          tableName: 'DeveloperRating',
          lockType: 'tuple',
          mode: 'ExclusiveLock',
          isInteractiveUserQuery: true,
          isBackgroundWorkerQuery: false,
          priority: 'HIGH_INTERACTIVE',
        },
        {
          blockedPid: 6002,
          blockingPid: 6001,
          blockedQuery: 'UPDATE "analytics_aggregate_table" SET count = 50',
          blockingQuery:
            'UPDATE "DeveloperRating" SET elo = 2100 WHERE user_id = 42',
          blockedDurationMs: 3400,
          tableName: 'analytics_aggregate_table',
          lockType: 'relation',
          mode: 'ShareLock',
          isInteractiveUserQuery: false,
          isBackgroundWorkerQuery: true,
          priority: 'LOW_BACKGROUND',
        },
      ]),
      terminateBackendProcess: terminateSpy,
    };

    service.setDatabaseAdapter(mockDbAdapter);

    const result = await service.detectAndResolveDeadlocks();

    expect(result.blockedCount).toBe(2);
    expect(result.cyclesResolvedCount).toBe(1);
    expect(result.cycles[0].resolutionStatus).toBe(
      'RESOLVED_TERMINATED_VICTIM',
    );

    // Verify termination of background worker PID 6002
    expect(terminateSpy).toHaveBeenCalledWith(6002);

    // Verify post-mortem recorded
    const postMortems = service.getPostMortems();
    expect(postMortems.length).toBe(1);
    expect(postMortems[0].victimPid).toBe(6002);
    expect(postMortems[0].unblockedPid).toBe(6001);
    expect(postMortems[0].tableName).toBe('analytics_aggregate_table');

    // Verify Prometheus metric incremented
    const metricsText = await service.getPrometheusMetrics();
    expect(metricsText).toContain('db_deadlocks_detected_total 1');
  });

  it('should not terminate anything if transactions are not in a cyclical deadlock', async () => {
    const terminateSpy = jest.fn();
    const mockDbAdapter: IDeadlockDatabaseAdapter = {
      queryLockContention: jest.fn().mockResolvedValue([
        // Single linear block (PID 7001 waiting for PID 7002, but PID 7002 is not blocked)
        {
          blockedPid: 7001,
          blockingPid: 7002,
          blockedQuery: 'SELECT * FROM "DeveloperRating"',
          blockingQuery: 'SELECT * FROM "Battle"',
          blockedDurationMs: 1500,
          tableName: 'DeveloperRating',
          lockType: 'relation',
          mode: 'AccessShareLock',
          isInteractiveUserQuery: true,
          isBackgroundWorkerQuery: false,
          priority: 'HIGH_INTERACTIVE',
        },
      ]),
      terminateBackendProcess: terminateSpy,
    };

    service.setDatabaseAdapter(mockDbAdapter);

    const result = await service.detectAndResolveDeadlocks();
    expect(result.cyclesResolvedCount).toBe(0);
    expect(terminateSpy).not.toHaveBeenCalled();
  });
});
