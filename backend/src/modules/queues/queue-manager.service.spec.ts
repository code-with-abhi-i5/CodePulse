import { Test, TestingModule } from '@nestjs/testing';
import { QueueManagerService } from './queue-manager.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { QueueShard } from './queue-manager.types';
import { getQueueToken } from '@nestjs/bullmq';

describe('QueueManagerService (Sharded BullMQ Multi-Worker Queue Processor)', () => {
  let service: QueueManagerService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      battle: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueManagerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: getQueueToken(QueueShard.SYNC_PRIORITY), useValue: null },
        { provide: getQueueToken(QueueShard.SYNC_BULK), useValue: null },
        { provide: getQueueToken(QueueShard.BATTLES_EVAL), useValue: null },
        { provide: getQueueToken(QueueShard.NOTIFICATIONS_PUSH), useValue: null },
      ],
    }).compile();

    service = module.get<QueueManagerService>(QueueManagerService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Queue Sharding & User Tier Partitioning', () => {
    it('routes active battle competitor to priority queue with 0ms delay and priority 1', async () => {
      mockPrisma.battle.findFirst.mockResolvedValueOnce({ id: 'battle-123' });

      const result = await service.routeSyncJob({
        userId: 'competitor-user-1',
      });

      expect(result.shard).toBe(QueueShard.SYNC_PRIORITY);
      expect(result.status).toBe('enqueued');

      const metrics = service.getShardMetrics(QueueShard.SYNC_PRIORITY);
      expect(metrics.waiting).toBe(1);
    });

    it('routes bulk daily sync to bulk queue with rate-limited flow control delay', async () => {
      mockPrisma.battle.findFirst.mockResolvedValueOnce(null);

      const result = await service.routeSyncJob({
        userId: 'bulk-user-99',
        isPriority: false,
      });

      expect(result.shard).toBe(QueueShard.SYNC_BULK);
      // Bulk jobs have delay > 0 and enter delayed list
      const metrics = service.getShardMetrics(QueueShard.SYNC_BULK);
      expect(metrics.delayed).toBe(1);
    });

    it('routes battle evaluation jobs to battles:eval shard', async () => {
      const result = await service.routeBattleEvalJob({
        battleId: 'battle-456',
        submissionId: 'sub-789',
        code: 'function solution() { return 42; }',
        language: 'typescript',
      });

      expect(result.shard).toBe(QueueShard.BATTLES_EVAL);
      const metrics = service.getShardMetrics(QueueShard.BATTLES_EVAL);
      expect(metrics.waiting).toBe(1);
    });

    it('routes notification outbox jobs to notifications:push shard', async () => {
      const result = await service.routeNotificationJob({
        userId: 'user-notif',
        type: 'ACHIEVEMENT_UNLOCKED',
        payload: { title: 'Grandmaster' },
      });

      expect(result.shard).toBe(QueueShard.NOTIFICATIONS_PUSH);
      const metrics = service.getShardMetrics(QueueShard.NOTIFICATIONS_PUSH);
      expect(metrics.waiting).toBe(1);
    });
  });

  describe('Dynamic Concurrency Scaling', () => {
    it('scales up worker concurrency automatically when queue backlog exceeds 100 jobs', async () => {
      const initialMetrics = service.getShardMetrics(QueueShard.SYNC_BULK);
      const baseConcurrency = initialMetrics.concurrency;

      // Add 120 jobs to exceed the 100 backlog threshold
      for (let i = 0; i < 120; i++) {
        await service.addJob(QueueShard.SYNC_BULK, 'sync-item', { index: i });
      }

      const updatedMetrics = service.getShardMetrics(QueueShard.SYNC_BULK);
      expect(updatedMetrics.waiting).toBe(120);
      expect(updatedMetrics.concurrency).toBeGreaterThan(baseConcurrency);
    });

    it('throttles down worker concurrency when Redis CPU exceeds 70%', async () => {
      // First scale up with high backlog
      for (let i = 0; i < 110; i++) {
        await service.addJob(QueueShard.BATTLES_EVAL, 'eval-job', { index: i });
      }

      const highMetrics = service.getShardMetrics(QueueShard.BATTLES_EVAL);
      const highConcurrency = highMetrics.concurrency;

      // Simulate high Redis CPU load (75%)
      service.setRedisCpuPercent(75.0);
      const throttledMetrics = service.evaluateDynamicScaling(QueueShard.BATTLES_EVAL);

      expect(throttledMetrics.concurrency).toBeLessThan(highConcurrency);
      expect(throttledMetrics.redisCpuPercent).toBe(75.0);
    });

    it('safely scales down concurrency when backlog is cleared and queue is idle', async () => {
      // Add jobs and then clear
      for (let i = 0; i < 110; i++) {
        await service.addJob(QueueShard.NOTIFICATIONS_PUSH, 'notif', { index: i });
      }

      await service.clearQueue(QueueShard.NOTIFICATIONS_PUSH);
      service.setRedisCpuPercent(20.0);

      const idleMetrics = service.evaluateDynamicScaling(QueueShard.NOTIFICATIONS_PUSH);
      expect(idleMetrics.waiting).toBe(0);
      expect(idleMetrics.concurrency).toBeLessThanOrEqual(12);
    });
  });

  describe('Admin Queue Management API', () => {
    it('pauses and resumes queue shard execution', async () => {
      const paused = await service.pauseQueue(QueueShard.SYNC_PRIORITY);
      expect(paused.isPaused).toBe(true);

      const resumed = await service.resumeQueue(QueueShard.SYNC_PRIORITY);
      expect(resumed.isPaused).toBe(false);
    });

    it('allows admin to explicitly scale worker concurrency within bounds', () => {
      const scaled = service.scaleWorker(QueueShard.SYNC_PRIORITY, 20);
      expect(scaled.concurrency).toBe(20);

      // Clamps to max concurrency
      const clampedMax = service.scaleWorker(QueueShard.SYNC_PRIORITY, 999);
      expect(clampedMax.concurrency).toBe(35); // maxConcurrency for priority
    });

    it('clears waiting and delayed jobs in a shard', async () => {
      await service.addJob(QueueShard.SYNC_PRIORITY, 'job-1', { a: 1 });
      await service.addJob(QueueShard.SYNC_PRIORITY, 'job-2', { a: 2 });

      expect(service.getShardMetrics(QueueShard.SYNC_PRIORITY).waiting).toBe(2);

      const result = await service.clearQueue(QueueShard.SYNC_PRIORITY);
      expect(result.cleared).toBe(true);
      expect(service.getShardMetrics(QueueShard.SYNC_PRIORITY).waiting).toBe(0);
    });
  });

  describe('Queue Health Monitoring & Prometheus Metrics', () => {
    it('returns structured status metrics for all shards', () => {
      const shards = service.getAllShardsStatus();
      expect(shards.length).toBe(4);
      expect(shards.map((s) => s.shard)).toContain(QueueShard.SYNC_PRIORITY);
      expect(shards.map((s) => s.shard)).toContain(QueueShard.SYNC_BULK);
      expect(shards.map((s) => s.shard)).toContain(QueueShard.BATTLES_EVAL);
      expect(shards.map((s) => s.shard)).toContain(QueueShard.NOTIFICATIONS_PUSH);
    });

    it('exports valid Prometheus exposition format metrics', async () => {
      await service.addJob(QueueShard.SYNC_PRIORITY, 'priority-job', { id: 1 });
      const prometheus = await service.exportPrometheusMetrics();

      expect(prometheus).toContain('# HELP codepulse_queue_jobs_waiting');
      expect(prometheus).toContain('# TYPE codepulse_queue_jobs_waiting gauge');
      expect(prometheus).toContain(`codepulse_queue_jobs_waiting{shard="${QueueShard.SYNC_PRIORITY}"} 1`);
      expect(prometheus).toContain('codepulse_queue_worker_concurrency');
      expect(prometheus).toContain('codepulse_queue_redis_cpu_percent');
    });
  });

  describe('Fault & Stall Isolation', () => {
    it('ensures failures and stalls in bulk queue do not block priority or battles shards', async () => {
      // Pause or flood the bulk queue
      await service.pauseQueue(QueueShard.SYNC_BULK);
      for (let i = 0; i < 50; i++) {
        await service.addJob(QueueShard.SYNC_BULK, 'failing-bulk-job', { fail: true });
      }

      // Priority sync and battle eval jobs must still enqueue and process immediately
      const priorityResult = await service.routeSyncJob({
        userId: 'active-champion',
        isPriority: true,
      });

      const evalResult = await service.routeBattleEvalJob({
        battleId: 'championship-battle',
        code: 'eval()',
      });

      expect(priorityResult.shard).toBe(QueueShard.SYNC_PRIORITY);
      expect(evalResult.shard).toBe(QueueShard.BATTLES_EVAL);

      const priorityMetrics = service.getShardMetrics(QueueShard.SYNC_PRIORITY);
      const bulkMetrics = service.getShardMetrics(QueueShard.SYNC_BULK);

      expect(priorityMetrics.isPaused).toBe(false);
      expect(priorityMetrics.waiting).toBe(1);
      expect(bulkMetrics.isPaused).toBe(true);
      expect(bulkMetrics.waiting).toBe(50);
    });
  });

  describe('High-Throughput Stress Test (10,000 Simulated Concurrent Jobs)', () => {
    it('handles 10,000 simulated concurrent jobs with dynamic scale-up and non-blocking priority routing', async () => {
      const startTime = Date.now();
      const TOTAL_JOBS = 10000;

      // 1. Enqueue 9,800 bulk sync jobs
      const bulkJobsPromises: Promise<any>[] = [];
      for (let i = 0; i < 9800; i++) {
        bulkJobsPromises.push(
          service.addJob(QueueShard.SYNC_BULK, 'stress-bulk-sync', { userId: `user-${i}` }),
        );
      }

      // 2. Enqueue 200 high-priority active competitor sync jobs concurrently
      const priorityJobsPromises: Promise<any>[] = [];
      for (let i = 0; i < 200; i++) {
        priorityJobsPromises.push(
          service.routeSyncJob({
            userId: `competitor-${i}`,
            isPriority: true,
          }),
        );
      }

      await Promise.all([...bulkJobsPromises, ...priorityJobsPromises]);

      const bulkStatus = service.getShardMetrics(QueueShard.SYNC_BULK);
      const priorityStatus = service.getShardMetrics(QueueShard.SYNC_PRIORITY);

      // Verify that 9,800 bulk jobs are queued in bulk shard
      expect(bulkStatus.waiting).toBe(9800);
      // Verify that dynamic scaling triggered for bulk shard (maxConcurrency)
      expect(bulkStatus.concurrency).toBe(25); // maxConcurrency for bulk

      // Verify that 200 priority jobs are in priority shard
      expect(priorityStatus.waiting).toBe(200);
      expect(priorityStatus.concurrency).toBeGreaterThanOrEqual(10);

      // 3. Process batches of jobs simulating multi-worker throughput
      const priorityProcessed = service.processBatchSimulatedJobs(QueueShard.SYNC_PRIORITY, 200);
      expect(priorityProcessed.processed).toBe(200);
      expect(service.getShardMetrics(QueueShard.SYNC_PRIORITY).waiting).toBe(0);

      const bulkProcessed = service.processBatchSimulatedJobs(QueueShard.SYNC_BULK, 9800);
      expect(bulkProcessed.processed).toBe(9800);
      expect(service.getShardMetrics(QueueShard.SYNC_BULK).waiting).toBe(0);

      const durationMs = Date.now() - startTime;
      expect(durationMs).toBeLessThan(10000); // 10,000 jobs enqueued and processed well under 10 seconds
    });
  });
});

