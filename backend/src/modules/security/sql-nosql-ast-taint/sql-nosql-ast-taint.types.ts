/**
 * @file sql-nosql-ast-taint.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-AST-SQLI-119]: SQL & NoSQL AST Taint Firewall Blocking Dynamic Raw Query Interpolation in Backend Services.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SqlNosqlAstTaintState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SqlNosqlAstTaintSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SqlNosqlAstTaintErrorCode {
  RECORD_NOT_FOUND = 'SQLNOSQLASTTAINT_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SQLNOSQLASTTAINT_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SQLNOSQLASTTAINT_EMPTY_PAYLOAD',
  INVALID_STATE = 'SQLNOSQLASTTAINT_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SQLNOSQLASTTAINT_CAPACITY_EXCEEDED',
  TIMEOUT = 'SQLNOSQLASTTAINT_TIMEOUT',
  SECURITY_VIOLATION = 'SQLNOSQLASTTAINT_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SQLNOSQLASTTAINT_CHECKSUM_MISMATCH',
}

export interface SqlNosqlAstTaintThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SqlNosqlAstTaintConfig {
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
  thresholds: SqlNosqlAstTaintThresholds;
}

export interface SqlNosqlAstTaintRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SqlNosqlAstTaintState;
  severity: SqlNosqlAstTaintSeverity;
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

export interface SqlNosqlAstTaintMetricSnapshot {
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

export interface SqlNosqlAstTaintFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SqlNosqlAstTaintState;
  severity?: SqlNosqlAstTaintSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SqlNosqlAstTaintHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SqlNosqlAstTaintState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SqlNosqlAstTaintAuditEvent {
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

export interface SqlNosqlAstTaintBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SqlNosqlAstTaintRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SqlNosqlAstTaintSubscriberCallback {
  (record: SqlNosqlAstTaintRecord): void | Promise<void>;
}

export class SqlNosqlAstTaintException extends Error {
  constructor(
    public readonly code: SqlNosqlAstTaintErrorCode | string,
    message: string,
    public readonly severity: SqlNosqlAstTaintSeverity = SqlNosqlAstTaintSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SqlNosqlAstTaintException';
  }
}

