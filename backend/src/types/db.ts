

// --- Batch 12 DB Types ---
export interface TableBloatReport {
  tableName: string;
  liveTuples: number;
  deadTuples: number;
  deadTupleRatio: number;
  urgency: 'EMERGENCY' | 'ELEVATED' | 'HEALTHY';
  recommendedVacuumSql: string;
}

export interface MigrationLockStatus {
  acquired: boolean;
  lockKey: number;
  leaseExpiresAt: number;
  ownerId: string;
}

export interface DeadlockRetryConfig {
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
}

export interface WalLogEvent {
  lsn: string;
  transactionId: number;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  documentId: string;
  payload: Record<string, unknown>;
}

export interface RedisPipelineBatch {
  slot: number;
  commands: Array<{ command: string; args: string[] }>;
  totalCommands: number;
}

export interface ProjectionOptimizationResult {
  optimizedSql: string;
  requestedFields: string[];
  strippedColumns: string[];
  estimatedPayloadSavingsPercent: number;
}

export interface ClickhouseBatchBlock {
  blockId: string;
  rowCount: number;
  coalescedPayload: string;
  flushReason: 'SIZE_THRESHOLD' | 'TIMEOUT_FLUSH';
}

export interface PoolScalingDecision {
  currentActive: number;
  currentMax: number;
  queueLength: number;
  recommendedMax: number;
  action: 'SCALE_UP' | 'SCALE_DOWN' | 'NO_OP';
  reason: string;
}

export interface PartitionRoutingResult {
  partitionTableName: string;
  partitionYear: number;
  partitionMonth: number;
  partitionDay: number;
  createPartitionSql: string;
}

export interface ReplicaLoadProfile {
  replicaId: string;
  lagSeconds: number;
  activeQueries: number;
  isEligible: boolean;
}
