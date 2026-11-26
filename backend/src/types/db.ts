
// --- Batch 9 DB Types ---
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
