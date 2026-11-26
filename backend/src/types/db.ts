
// --- Batch 10 DB Types ---
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
