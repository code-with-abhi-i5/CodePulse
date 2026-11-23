/**
 * @file deficit-round-robin-drr.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [EVENT-FAIR-SHARE-125]: Deficit Round Robin (DRR) Fair-Share Queue Scheduler for Multi-Tenant Submissions.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DeficitRoundRobinDrrState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DeficitRoundRobinDrrSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DeficitRoundRobinDrrErrorCode {
  RECORD_NOT_FOUND = 'DEFICITROUNDROBINDRR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DEFICITROUNDROBINDRR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DEFICITROUNDROBINDRR_EMPTY_PAYLOAD',
  INVALID_STATE = 'DEFICITROUNDROBINDRR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DEFICITROUNDROBINDRR_CAPACITY_EXCEEDED',
  TIMEOUT = 'DEFICITROUNDROBINDRR_TIMEOUT',
  SECURITY_VIOLATION = 'DEFICITROUNDROBINDRR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DEFICITROUNDROBINDRR_CHECKSUM_MISMATCH',
}

export interface DeficitRoundRobinDrrThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DeficitRoundRobinDrrConfig {
  id: string;
  name: string;
  enabled: boolean;
  maxConcurrency: number;
  sampleIntervalMs: number;
  thresholdHighWatermark: number;
  thresholdLowWatermark: number;
  evictionPolicy: 'LRU' | 'FIFO' | 'EXPONENTIAL' | 'ADAPTIVE' | 'LEAST_FREQUENTLY_USED';
  retentionDurationSec: number;
  enableTelemetry: boolean;
  enablePrometheusExport: boolean;
  alertWebhookUrl?: string;
  tags?: Record<string, string>;
  thresholds: DeficitRoundRobinDrrThresholds;
}

export interface DeficitRoundRobinDrrRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DeficitRoundRobinDrrState;
  severity: DeficitRoundRobinDrrSeverity;
  payload: Record<string, unknown>;
  checksum: string;
  executionDurationMs: number;
  retryCount: number;
  cpuTimeMicros: number;
  memoryDeltaBytes: number;
  errorMessage?: string;
  tags: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface DeficitRoundRobinDrrMetricSnapshot {
  timestamp: number;
  activeCount: number;
  processedCount: number;
  failureCount: number;
  evictedCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  heapUtilizationBytes: number;
  bufferUtilizationPct: number;
  throughputPerSecond: number;
  errorRatePercentage: number;
}

export interface DeficitRoundRobinDrrFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DeficitRoundRobinDrrState;
  severity?: DeficitRoundRobinDrrSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeficitRoundRobinDrrHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DeficitRoundRobinDrrState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DeficitRoundRobinDrrAuditEvent {
  eventId: string;
  actorId: string;
  action: string;
  resourceId: string;
  timestamp: number;
  oldState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  details?: string;
}

export interface DeficitRoundRobinDrrBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DeficitRoundRobinDrrRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DeficitRoundRobinDrrSubscriberCallback {
  (record: DeficitRoundRobinDrrRecord): void | Promise<void>;
}

export class DeficitRoundRobinDrrException extends Error {
  constructor(
    public readonly code: DeficitRoundRobinDrrErrorCode | string,
    message: string,
    public readonly severity: DeficitRoundRobinDrrSeverity = DeficitRoundRobinDrrSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DeficitRoundRobinDrrException';
  }
}

