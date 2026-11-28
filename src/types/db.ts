export interface ReentrantLockLease {
  lockKey: string;
  ownerToken: string;
  reentrantCount: number;
  leaseExpiresAt: number;
  isHeld: boolean;
}

export interface DbCircuitBreakerMetrics {
  totalQueries: number;
  errorCount: number;
  errorRatePercentage: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface IndexBloatReport {
  indexName: string;
  tableName: string;
  bloatPercentage: number;
  isEligibleForReindex: boolean;
  reindexSql: string;
}

export interface ReplicaLagMeasurement {
  region: string;
  lagMs: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  isEligibleForReads: boolean;
}

export interface ArchiveResult {
  recordsArchived: number;
  cutoffTimestamp: number;
  archiveChunkId: string;
  estimatedDiskReclaimedBytes: number;
}

export interface EncryptedColumnPayload {
  cipherText: string;
  algorithm: string;
  isEncrypted: boolean;
}

export interface LeasedConnectionRecord {
  connectionId: string;
  acquiredAt: number;
  heldDurationMs: number;
  isLeaked: boolean;
  handlerContext: string;
}

export interface ClaimResult {
  claimedCount: number;
  claimedMessageIds: string[];
  targetConsumer: string;
}

export interface TsvectorCompilation {
  language: string;
  generatedExpression: string;
  queryExpression: string;
}

export interface KeysetCursor<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface QueryTimeoutConfig {
  queryType: 'oltp' | 'analytics' | 'maintenance';
  statementTimeoutMs: number;
  enforceDynamicTimeout: boolean;
}

export interface SequenceExhaustReport {
  sequenceName: string;
  currentValue: number;
  maxValue: number;
  percentUsed: number;
  isNearingExhaustion: boolean;
}

export interface TenantRoutingResult {
  tenantId: string;
  connectionPoolName: string;
  isDedicated: boolean;
  activeConnections: number;
}

export interface CascadeValidationResult {
  parentEntity: string;
  parentId: string;
  dependentRecordCount: number;
  isSafeToDelete: boolean;
  warning?: string;
}

export interface BoundSqlStatement {
  parameterizedSql: string;
  extractedParameters: any[];
  hashKey: string;
}

export interface QueryCacheLookup {
  isHit: boolean;
  cachedRows?: any[];
  invalidatingTables: string[];
}

export interface ReshardingSlotState {
  slotId: number;
  sourceNode: string;
  destinationNode: string;
  status: 'STABLE' | 'MIGRATING' | 'IMPORTING';
  keysMigrated: number;
}

export interface BulkIngestResult {
  rowsIngested: number;
  durationMs: number;
  throughputRowsPerSec: number;
  protocol: 'COPY_BINARY' | 'INSERT_BATCH';
}

export interface RewrittenSqlResult {
  originalSql: string;
  rewrittenSql: string;
  injectedFiltersCount: number;
}

export interface LeaderboardRankResult {
  userId: string;
  score: number;
  rank: number;
  totalParticipants: number;
  percentile: number;
}

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
