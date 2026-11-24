import { QueueShard, SHARDED_QUEUES } from './queue-manager.types';

export { QueueShard, SHARDED_QUEUES };

export const RETRY_POLICY = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnFail: false,
};

export const SOURCE_QUEUES = [
  'challenges',
  'leaderboard-sync',
  'github-sync',
] as const;

export const ALL_QUEUES = [
  ...SOURCE_QUEUES,
  ...SHARDED_QUEUES,
] as const;
