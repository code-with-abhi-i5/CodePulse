

// --- Batch 11 DB Types ---
export interface PitrSnapshotConfig {
  retentionDays: number;
  snapshotIntervalMinutes: number;
  walArchiveBucket: string;
}

export interface PitrValidationResult {
  isValid: boolean;
  baseBackupTimestamp: number;
  targetRecoveryTime: number;
  availableWalRange: { start: string; end: string };
  missingWalSegments: string[];
}

export interface ReplicaPromoteCheckResult {
  isEligibleForPromote: boolean;
  replicaId: string;
  replicationLagBytes: number;
  replayLagSeconds: number;
  syncState: 'streaming' | 'in_sync' | 'catchup' | 'disconnected';
  reasons: string[];
}

export interface LogicalReplicationEvent {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  commitTimestamp: number;
  txId: number;
  data: Record<string, unknown>;
}

export interface RedisMemoryStats {
  usedMemoryBytes: number;
  maxMemoryBytes: number;
  usedMemoryPercentage: number;
  evictionPolicy: 'noeviction' | 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu';
  evictedKeysTotal: number;
  isNearingCapacity: boolean;
}

export interface QueryCostPlan {
  totalCost: number;
  startupCost: number;
  planRows: number;
  planWidth: number;
  hasSequentialScan: boolean;
  scannedTable?: string;
  isRejected: boolean;
  rejectionReason?: string;
}

export interface TenantMigrationResult {
  tenantId: string;
  schemaName: string;
  executedMigrations: string[];
  durationMs: number;
  success: boolean;
}

export interface XFetchResult<T> {
  value: T;
  needsEarlyRecomputation: boolean;
  ttlRemainingMs: number;
}

export interface ConcurrencyCheckResult {
  canUpdate: boolean;
  currentVersion: number;
  expectedVersion: number;
  conflictDetected: boolean;
  sqlPredicate: string;
}

export interface ReadRoutingDecision {
  targetNode: 'primary' | 'replica';
  reason: 'recent_write_window' | 'replica_healthy' | 'transaction_active';
  windowRemainingMs?: number;
}

export interface IndexRecommendation {
  tableName: string;
  indexType: 'btree_composite' | 'gin';
  columns: string[];
  reason: string;
  recommendedSql: string;
}
