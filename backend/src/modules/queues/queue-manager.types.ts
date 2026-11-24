export enum QueueShard {
  SYNC_PRIORITY = 'queue-sync-priority',
  SYNC_BULK = 'queue-sync-bulk',
  BATTLES_EVAL = 'queue-battles-eval',
  NOTIFICATIONS_PUSH = 'queue-notifications-push',
}

export const SHARDED_QUEUES = [
  QueueShard.SYNC_PRIORITY,
  QueueShard.SYNC_BULK,
  QueueShard.BATTLES_EVAL,
  QueueShard.NOTIFICATIONS_PUSH,
] as const;

export interface ShardConfig {
  name: QueueShard;
  concurrency: number;
  minConcurrency: number;
  maxConcurrency: number;
  isPaused: boolean;
  backlogThreshold: number; // backlog threshold for auto scale-up (e.g. 100)
}

export interface ShardMetrics {
  shard: string;
  active: number;
  waiting: number;
  delayed: number;
  failed: number;
  completed: number;
  concurrency: number;
  isPaused: boolean;
  redisCpuPercent: number;
}

export interface ShardScaleEvent {
  shard: string;
  previousConcurrency: number;
  newConcurrency: number;
  reason: string;
  timestamp: number;
}

export interface RouteSyncJobOptions {
  userId: string;
  isPriority?: boolean;
  overrideDelayMs?: number;
  jobId?: string;
  metadata?: Record<string, any>;
}

export interface RouteBattleEvalJobOptions {
  battleId: string;
  submissionId?: string;
  code?: string;
  language?: string;
  userId?: string;
  jobId?: string;
}

export interface RouteNotificationJobOptions {
  userId: string;
  type: string;
  payload: any;
  jobId?: string;
}

