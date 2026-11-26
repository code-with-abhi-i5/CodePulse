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
