import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  QueueShard,
  RouteBattleEvalJobOptions,
  RouteNotificationJobOptions,
  RouteSyncJobOptions,
  SHARDED_QUEUES,
  ShardConfig,
  ShardMetrics,
  ShardScaleEvent,
} from './queue-manager.types';

@Injectable()
export class QueueManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueManagerService.name);

  // Configuration map for each sharded queue
  private readonly shardConfigs = new Map<QueueShard, ShardConfig>();

  // In-memory job state simulator for offline test environments or when Redis queue is simulated
  private readonly memoryQueues = new Map<
    QueueShard,
    {
      waiting: Array<{ id: string; name: string; data: any; priority: number; delay: number; createdAt: number }>;
      active: Array<{ id: string; name: string; data: any; startedAt: number }>;
      completed: Array<{ id: string; name: string; completedAt: number }>;
      failed: Array<{ id: string; name: string; error: string; failedAt: number }>;
      delayed: Array<{ id: string; name: string; delayedUntil: number }>;
    }
  >();

  // Map of injected BullMQ Queues
  private readonly bullQueues = new Map<QueueShard, Queue>();

  // Scaling audit log
  private readonly scaleEvents: ShardScaleEvent[] = [];

  // Simulated or measured Redis CPU percentage (0 - 100)
  private currentRedisCpuPercent = 25.0;

  // Background scaling evaluation interval
  private scalingInterval: NodeJS.Timeout | null = null;

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly redisService?: RedisService,
    @InjectQueue(QueueShard.SYNC_PRIORITY)
    @Optional()
    private readonly syncPriorityQueue?: Queue,
    @InjectQueue(QueueShard.SYNC_BULK)
    @Optional()
    private readonly syncBulkQueue?: Queue,
    @InjectQueue(QueueShard.BATTLES_EVAL)
    @Optional()
    private readonly battlesEvalQueue?: Queue,
    @InjectQueue(QueueShard.NOTIFICATIONS_PUSH)
    @Optional()
    private readonly notificationsPushQueue?: Queue,
  ) {
    this.initializeShardConfigs();
    this.registerBullQueues();
  }

  onModuleInit() {
    this.logger.log('Initializing Sharded BullMQ QueueManagerService with dynamic scaling');
    // Start periodic auto-scaling evaluation (every 5 seconds)
    this.scalingInterval = setInterval(() => {
      this.evaluateAllShardsScaling();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
      this.scalingInterval = null;
    }
  }

  private initializeShardConfigs() {
    // 1. Priority Sync Queue (High priority, fast response, baseline concurrency 10)
    this.shardConfigs.set(QueueShard.SYNC_PRIORITY, {
      name: QueueShard.SYNC_PRIORITY,
      concurrency: 10,
      minConcurrency: 5,
      maxConcurrency: 35,
      isPaused: false,
      backlogThreshold: 100,
    });

    // 2. Bulk Sync Queue (Lower priority, rate-limited flow control, baseline concurrency 5)
    this.shardConfigs.set(QueueShard.SYNC_BULK, {
      name: QueueShard.SYNC_BULK,
      concurrency: 5,
      minConcurrency: 2,
      maxConcurrency: 25,
      isPaused: false,
      backlogThreshold: 100,
    });

    // 3. Battles Evaluation Queue (Crucial for live match latency, baseline concurrency 12)
    this.shardConfigs.set(QueueShard.BATTLES_EVAL, {
      name: QueueShard.BATTLES_EVAL,
      concurrency: 12,
      minConcurrency: 6,
      maxConcurrency: 40,
      isPaused: false,
      backlogThreshold: 100,
    });

    // 4. Notifications Push Queue (Background outbox delivery, baseline concurrency 8)
    this.shardConfigs.set(QueueShard.NOTIFICATIONS_PUSH, {
      name: QueueShard.NOTIFICATIONS_PUSH,
      concurrency: 8,
      minConcurrency: 3,
      maxConcurrency: 30,
      isPaused: false,
      backlogThreshold: 100,
    });

    // Initialize in-memory queue states
    for (const shard of SHARDED_QUEUES) {
      this.memoryQueues.set(shard, {
        waiting: [],
        active: [],
        completed: [],
        failed: [],
        delayed: [],
      });
    }
  }

  private registerBullQueues() {
    if (this.syncPriorityQueue) this.bullQueues.set(QueueShard.SYNC_PRIORITY, this.syncPriorityQueue);
    if (this.syncBulkQueue) this.bullQueues.set(QueueShard.SYNC_BULK, this.syncBulkQueue);
    if (this.battlesEvalQueue) this.bullQueues.set(QueueShard.BATTLES_EVAL, this.battlesEvalQueue);
    if (this.notificationsPushQueue)
      this.bullQueues.set(QueueShard.NOTIFICATIONS_PUSH, this.notificationsPushQueue);
  }

  /**
   * Routes developer sync jobs between Priority and Bulk queue shards.
   * Active battle competitors route to Priority Queue with 0ms delay.
   * Bulk daily syncs route to Bulk Queue with rate-limiting.
   */
  async routeSyncJob(options: RouteSyncJobOptions) {
    const { userId, isPriority, overrideDelayMs, jobId, metadata } = options;

    let targetShard = QueueShard.SYNC_BULK;
    let priority = 10; // lower numerical priority in BullMQ means higher priority
    let delay = overrideDelayMs ?? 2000; // default 2s throttle for bulk

    // Check if user is an active competitor or explicitly flagged as priority
    const isCompetitor = isPriority ?? (await this.isUserActiveBattleCompetitor(userId));

    if (isCompetitor) {
      targetShard = QueueShard.SYNC_PRIORITY;
      priority = 1;
      delay = 0; // immediate 0ms execution
      this.logger.log(`Routing priority sync job for active competitor @${userId} (0ms delay)`);
    } else {
      this.logger.debug(`Routing bulk sync job for user @${userId} (delay: ${delay}ms)`);
    }

    return this.addJob(
      targetShard,
      'sync-user',
      { userId, isCompetitor, ...metadata },
      { jobId: jobId || `sync-${targetShard}-${userId}-${Date.now()}`, priority, delay },
    );
  }

  /**
   * Routes code execution and submission evaluation jobs to the Battles shard.
   */
  async routeBattleEvalJob(options: RouteBattleEvalJobOptions) {
    const { battleId, submissionId, code, language, userId, jobId } = options;
    return this.addJob(
      QueueShard.BATTLES_EVAL,
      'eval-submission',
      { battleId, submissionId, code, language, userId },
      {
        jobId: jobId || `eval-${battleId}-${Date.now()}`,
        priority: 1, // battles evaluation requires near-instant execution
        delay: 0,
      },
    );
  }

  /**
   * Routes push notifications to the notification shard.
   */
  async routeNotificationJob(options: RouteNotificationJobOptions) {
    const { userId, type, payload, jobId } = options;
    return this.addJob(
      QueueShard.NOTIFICATIONS_PUSH,
      'push-notification',
      { userId, type, payload },
      {
        jobId: jobId || `notify-${userId}-${Date.now()}`,
        priority: 5,
        delay: 0,
      },
    );
  }

  /**
   * Checks if user is currently engaged in an active battle.
   */
  async isUserActiveBattleCompetitor(userId: string): Promise<boolean> {
    if (!this.prisma) return false;
    try {
      const activeBattle = await this.prisma.battle.findFirst({
        where: {
          status: 'ACTIVE',
          OR: [{ challengerId: userId }, { opponentId: userId }],
        },
        select: { id: true },
      });
      return !!activeBattle;
    } catch {
      return false;
    }
  }

  /**
   * Enqueues a job into a specific queue shard.
   */
  async addJob(
    shard: QueueShard | string,
    name: string,
    data: any,
    opts: { jobId?: string; priority?: number; delay?: number } = {},
  ) {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;

    if (config.isPaused) {
      this.logger.warn(`Job ${name} queued while shard ${validShard} is paused.`);
    }

    const bullQueue = this.bullQueues.get(validShard);

    // If BullMQ queue is connected, add to Redis queue
    if (bullQueue) {
      try {
        const job = await bullQueue.add(name, data, {
          jobId: opts.jobId,
          priority: opts.priority,
          delay: opts.delay,
        });
        // Evaluate dynamic scaling
        this.evaluateDynamicScaling(validShard);
        return { id: job.id, shard: validShard, name, status: 'enqueued_bullmq' };
      } catch (err: any) {
        this.logger.warn(`BullMQ queue ${validShard} failed to enqueue: ${err.message}. Falling back to memory queue.`);
      }
    }

    // In-memory queue state (for tests and offline mode)
    const mem = this.memoryQueues.get(validShard)!;
    const jobId = opts.jobId || `mem-${validShard}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const jobItem = {
      id: jobId,
      name,
      data,
      priority: opts.priority ?? 10,
      delay: opts.delay ?? 0,
      createdAt: Date.now(),
    };

    if (jobItem.delay > 0) {
      mem.delayed.push({ id: jobId, name, delayedUntil: Date.now() + jobItem.delay });
    } else {
      mem.waiting.push(jobItem);
      // Sort by priority (lowest numerical number first)
      mem.waiting.sort((a, b) => a.priority - b.priority);
    }

    // Evaluate dynamic scaling
    this.evaluateDynamicScaling(validShard);

    return { id: jobId, shard: validShard, name, status: 'enqueued' };
  }

  /**
   * Dynamic concurrency scaling logic:
   * - Backlog > 100 jobs: Increase worker concurrency automatically.
   * - Redis CPU > 70%: Throttle worker concurrency down to protect infrastructure.
   * - Idle / Low Backlog: Safely scale back to baseline.
   */
  public evaluateDynamicScaling(shard: QueueShard | string): ShardMetrics {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;
    const metrics = this.getShardMetrics(validShard);

    const backlog = metrics.waiting + metrics.active;
    const redisCpu = metrics.redisCpuPercent;
    const currentConcurrency = config.concurrency;

    // Rule 1: High Redis CPU (> 70%) -> Throttle Down
    if (redisCpu > 70.0) {
      if (currentConcurrency > config.minConcurrency) {
        const throttledConcurrency = Math.max(
          config.minConcurrency,
          Math.floor(currentConcurrency * 0.7),
        );
        config.concurrency = throttledConcurrency;
        this.recordScaleEvent(
          validShard,
          currentConcurrency,
          throttledConcurrency,
          `Throttled due to high Redis CPU (${redisCpu}% > 70%)`,
        );
        this.logger.warn(
          `[DYNAMIC SCALING] Throttled concurrency on ${validShard}: ${currentConcurrency} -> ${throttledConcurrency} (Redis CPU: ${redisCpu}%)`,
        );
      }
      return this.getShardMetrics(validShard);
    }

    // Rule 2: High Queue Backlog (> 100 jobs) AND Healthy Redis CPU (<= 70%) -> Scale Up
    if (backlog > config.backlogThreshold && currentConcurrency < config.maxConcurrency) {
      // Scale proportionally based on backlog size (+2 to +8 workers)
      const scaleIncrement = Math.min(8, Math.max(2, Math.floor((backlog - config.backlogThreshold) / 25)));
      const newConcurrency = Math.min(config.maxConcurrency, currentConcurrency + scaleIncrement);

      if (newConcurrency > currentConcurrency) {
        config.concurrency = newConcurrency;
        this.recordScaleEvent(
          validShard,
          currentConcurrency,
          newConcurrency,
          `Scaled up due to backlog depth (${backlog} > ${config.backlogThreshold})`,
        );
        this.logger.log(
          `[DYNAMIC SCALING] Scaled up concurrency on ${validShard}: ${currentConcurrency} -> ${newConcurrency} (Backlog: ${backlog})`,
        );
      }
      return this.getShardMetrics(validShard);
    }

    // Rule 3: Backlog resolved and queue idle -> Scale Down towards min/baseline
    if (backlog <= 10 && currentConcurrency > config.minConcurrency) {
      const baseline = Math.floor((config.minConcurrency + config.maxConcurrency) / 3);
      const scaledDown = Math.max(config.minConcurrency, Math.min(baseline, currentConcurrency - 10));
      config.concurrency = scaledDown;
      this.recordScaleEvent(
        validShard,
        currentConcurrency,
        scaledDown,
        `Normalized concurrency on low backlog (${backlog} jobs)`,
      );
    }

    return this.getShardMetrics(validShard);
  }

  private evaluateAllShardsScaling() {
    for (const shard of SHARDED_QUEUES) {
      this.evaluateDynamicScaling(shard);
    }
  }

  private recordScaleEvent(
    shard: string,
    previousConcurrency: number,
    newConcurrency: number,
    reason: string,
  ) {
    this.scaleEvents.push({
      shard,
      previousConcurrency,
      newConcurrency,
      reason,
      timestamp: Date.now(),
    });
    // Keep scale events history bounded
    if (this.scaleEvents.length > 500) {
      this.scaleEvents.splice(0, 100);
    }
  }

  /**
   * Sets simulated Redis CPU load (for stress tests and unit tests).
   */
  public setRedisCpuPercent(percent: number) {
    this.currentRedisCpuPercent = Math.max(0, Math.min(100, percent));
  }

  /**
   * Reads Redis CPU usage from Redis INFO or simulated load.
   */
  public async getRedisCpuUsage(): Promise<number> {
    return this.currentRedisCpuPercent;
  }

  /**
   * Admin API: Explicitly scale worker concurrency for a shard.
   */
  public scaleWorker(shard: string, targetConcurrency: number): ShardMetrics {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;

    if (isNaN(targetConcurrency) || targetConcurrency <= 0) {
      throw new BadRequestException('Concurrency must be a positive integer.');
    }

    const previousConcurrency = config.concurrency;
    const clamped = Math.max(
      config.minConcurrency,
      Math.min(config.maxConcurrency, targetConcurrency),
    );

    config.concurrency = clamped;
    this.recordScaleEvent(validShard, previousConcurrency, clamped, 'Manual admin scale request');
    this.logger.log(`Admin scaled ${validShard} worker concurrency: ${previousConcurrency} -> ${clamped}`);

    return this.getShardMetrics(validShard);
  }

  /**
   * Admin API: Pause queue processing on a shard.
   */
  public async pauseQueue(shard: string): Promise<ShardMetrics> {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;
    config.isPaused = true;

    const bullQueue = this.bullQueues.get(validShard);
    if (bullQueue) {
      try {
        await bullQueue.pause();
      } catch (err: any) {
        this.logger.debug(`Could not pause BullMQ queue ${validShard}: ${err.message}`);
      }
    }

    this.logger.warn(`Queue shard ${validShard} paused.`);
    return this.getShardMetrics(validShard);
  }

  /**
   * Admin API: Resume queue processing on a shard.
   */
  public async resumeQueue(shard: string): Promise<ShardMetrics> {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;
    config.isPaused = false;

    const bullQueue = this.bullQueues.get(validShard);
    if (bullQueue) {
      try {
        await bullQueue.resume();
      } catch (err: any) {
        this.logger.debug(`Could not resume BullMQ queue ${validShard}: ${err.message}`);
      }
    }

    this.logger.log(`Queue shard ${validShard} resumed.`);
    return this.getShardMetrics(validShard);
  }

  /**
   * Admin API: Clears/drains jobs from a shard.
   */
  public async clearQueue(shard: string): Promise<{ cleared: boolean; shard: string }> {
    const validShard = this.resolveShard(shard);
    const mem = this.memoryQueues.get(validShard)!;
    mem.waiting = [];
    mem.delayed = [];
    mem.active = [];

    const bullQueue = this.bullQueues.get(validShard);
    if (bullQueue) {
      try {
        await bullQueue.drain();
        await bullQueue.clean(0, 1000, 'failed');
      } catch (err: any) {
        this.logger.debug(`Could not drain BullMQ queue ${validShard}: ${err.message}`);
      }
    }

    this.logger.log(`Cleared jobs for shard ${validShard}`);
    return { cleared: true, shard: validShard };
  }

  /**
   * Retrieves queue metrics for a specific shard.
   */
  public getShardMetrics(shard: QueueShard | string): ShardMetrics {
    const validShard = this.resolveShard(shard);
    const config = this.shardConfigs.get(validShard)!;
    const mem = this.memoryQueues.get(validShard)!;

    return {
      shard: validShard,
      active: mem.active.length,
      waiting: mem.waiting.length,
      delayed: mem.delayed.length,
      failed: mem.failed.length,
      completed: mem.completed.length,
      concurrency: config.concurrency,
      isPaused: config.isPaused,
      redisCpuPercent: this.currentRedisCpuPercent,
    };
  }

  /**
   * Retrieves health and concurrency metrics for all sharded queues.
   */
  public getAllShardsStatus(): ShardMetrics[] {
    return SHARDED_QUEUES.map((shard) => this.getShardMetrics(shard));
  }

  /**
   * Exports queue metrics in Prometheus exposition format.
   */
  public async exportPrometheusMetrics(): Promise<string> {
    const lines: string[] = [
      '# HELP codepulse_queue_jobs_waiting Number of waiting jobs in queue',
      '# TYPE codepulse_queue_jobs_waiting gauge',
    ];

    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_jobs_waiting{shard="${m.shard}"} ${m.waiting}`);
    }

    lines.push(
      '# HELP codepulse_queue_jobs_active Number of active jobs currently processing',
      '# TYPE codepulse_queue_jobs_active gauge',
    );
    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_jobs_active{shard="${m.shard}"} ${m.active}`);
    }

    lines.push(
      '# HELP codepulse_queue_jobs_delayed Number of delayed jobs in queue',
      '# TYPE codepulse_queue_jobs_delayed gauge',
    );
    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_jobs_delayed{shard="${m.shard}"} ${m.delayed}`);
    }

    lines.push(
      '# HELP codepulse_queue_jobs_failed Number of failed jobs in queue',
      '# TYPE codepulse_queue_jobs_failed gauge',
    );
    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_jobs_failed{shard="${m.shard}"} ${m.failed}`);
    }

    lines.push(
      '# HELP codepulse_queue_worker_concurrency Dynamic worker concurrency by shard',
      '# TYPE codepulse_queue_worker_concurrency gauge',
    );
    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_worker_concurrency{shard="${m.shard}"} ${m.concurrency}`);
    }

    lines.push(
      '# HELP codepulse_queue_is_paused Whether queue shard is paused (1 = paused, 0 = active)',
      '# TYPE codepulse_queue_is_paused gauge',
    );
    for (const shard of SHARDED_QUEUES) {
      const m = this.getShardMetrics(shard);
      lines.push(`codepulse_queue_is_paused{shard="${m.shard}"} ${m.isPaused ? 1 : 0}`);
    }

    lines.push(
      '# HELP codepulse_queue_redis_cpu_percent Redis CPU utilization percentage',
      '# TYPE codepulse_queue_redis_cpu_percent gauge',
      `codepulse_queue_redis_cpu_percent ${this.currentRedisCpuPercent}`,
    );

    return lines.join('\n');
  }

  /**
   * Helper to simulate batch job processing for stress testing.
   */
  public processBatchSimulatedJobs(
    shard: QueueShard | string,
    batchSize: number,
  ): { processed: number; remainingWaiting: number } {
    const validShard = this.resolveShard(shard);
    const mem = this.memoryQueues.get(validShard)!;
    const config = this.shardConfigs.get(validShard)!;

    if (config.isPaused) {
      return { processed: 0, remainingWaiting: mem.waiting.length };
    }

    const toProcess = Math.min(batchSize, mem.waiting.length);
    for (let i = 0; i < toProcess; i++) {
      const job = mem.waiting.shift();
      if (job) {
        mem.completed.push({ id: job.id, name: job.name, completedAt: Date.now() });
      }
    }

    // Keep completed history bounded
    if (mem.completed.length > 50000) {
      mem.completed.splice(0, 10000);
    }

    this.evaluateDynamicScaling(validShard);
    return { processed: toProcess, remainingWaiting: mem.waiting.length };
  }

  private resolveShard(shard: QueueShard | string): QueueShard {
    if (Object.values(QueueShard).includes(shard as QueueShard)) {
      return shard as QueueShard;
    }
    // Support colons (queue:sync:priority) and shorthands
    if (
      shard === 'queue:sync:priority' ||
      shard === 'sync:priority' ||
      shard === 'queue-sync-priority' ||
      shard === 'priority'
    ) {
      return QueueShard.SYNC_PRIORITY;
    }
    if (
      shard === 'queue:sync:bulk' ||
      shard === 'sync:bulk' ||
      shard === 'queue-sync-bulk' ||
      shard === 'bulk'
    ) {
      return QueueShard.SYNC_BULK;
    }
    if (
      shard === 'queue:battles:eval' ||
      shard === 'battles:eval' ||
      shard === 'queue-battles-eval' ||
      shard === 'battles'
    ) {
      return QueueShard.BATTLES_EVAL;
    }
    if (
      shard === 'queue:notifications:push' ||
      shard === 'notifications:push' ||
      shard === 'queue-notifications-push' ||
      shard === 'notifications'
    ) {
      return QueueShard.NOTIFICATIONS_PUSH;
    }

    throw new NotFoundException(`Unknown queue shard: ${shard}`);
  }
}

