export type DriftReason = 'MISSING_IN_REDIS' | 'SCORE_DRIFT' | 'ORPHAN_IN_REDIS';

export interface DriftEntry {
  userId: string;
  metric: string;
  postgresScore: number;
  redisScore: number | null;
  driftDelta: number;
  reason: DriftReason;
  repairedAt: string;
}

export interface ReconciliationAuditReport {
  reconciliationId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalPostgresRecords: number;
  totalRedisRecords: number;
  driftsFound: number;
  repairedCount: number;
  details: DriftEntry[];
  status: 'IN_SYNC' | 'DRIFT_REPAIRED' | 'FAILED';
}
