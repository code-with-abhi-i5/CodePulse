/**
 * @file safe-nl2sql-compiler.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-NL2SQL-074]: Natural Language to Safe PostgreSQL Compiler with AST Schema Validation & Read-Only Sandbox.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SafeNl2SqlCompilerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SafeNl2SqlCompilerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SafeNl2SqlCompilerErrorCode {
  RECORD_NOT_FOUND = 'SAFENL2SQLCOMPILER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SAFENL2SQLCOMPILER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SAFENL2SQLCOMPILER_EMPTY_PAYLOAD',
  INVALID_STATE = 'SAFENL2SQLCOMPILER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SAFENL2SQLCOMPILER_CAPACITY_EXCEEDED',
  TIMEOUT = 'SAFENL2SQLCOMPILER_TIMEOUT',
  SECURITY_VIOLATION = 'SAFENL2SQLCOMPILER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SAFENL2SQLCOMPILER_CHECKSUM_MISMATCH',
}

export interface SafeNl2SqlCompilerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SafeNl2SqlCompilerConfig {
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
  thresholds: SafeNl2SqlCompilerThresholds;
}

export interface SafeNl2SqlCompilerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SafeNl2SqlCompilerState;
  severity: SafeNl2SqlCompilerSeverity;
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

export interface SafeNl2SqlCompilerMetricSnapshot {
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

export interface SafeNl2SqlCompilerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SafeNl2SqlCompilerState;
  severity?: SafeNl2SqlCompilerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SafeNl2SqlCompilerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SafeNl2SqlCompilerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SafeNl2SqlCompilerAuditEvent {
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

export interface SafeNl2SqlCompilerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SafeNl2SqlCompilerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SafeNl2SqlCompilerSubscriberCallback {
  (record: SafeNl2SqlCompilerRecord): void | Promise<void>;
}

export class SafeNl2SqlCompilerException extends Error {
  constructor(
    public readonly code: SafeNl2SqlCompilerErrorCode | string,
    message: string,
    public readonly severity: SafeNl2SqlCompilerSeverity = SafeNl2SqlCompilerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SafeNl2SqlCompilerException';
  }
}

