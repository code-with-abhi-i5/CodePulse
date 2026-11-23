/**
 * @file polyglot-ast-transpiler.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-TRANSPILER-065]: Polyglot Code Transpiler with Semantic Equivalence Verification & Idiomatic AST Refactoring.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PolyglotAstTranspilerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PolyglotAstTranspilerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PolyglotAstTranspilerErrorCode {
  RECORD_NOT_FOUND = 'POLYGLOTASTTRANSPILER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'POLYGLOTASTTRANSPILER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'POLYGLOTASTTRANSPILER_EMPTY_PAYLOAD',
  INVALID_STATE = 'POLYGLOTASTTRANSPILER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'POLYGLOTASTTRANSPILER_CAPACITY_EXCEEDED',
  TIMEOUT = 'POLYGLOTASTTRANSPILER_TIMEOUT',
  SECURITY_VIOLATION = 'POLYGLOTASTTRANSPILER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'POLYGLOTASTTRANSPILER_CHECKSUM_MISMATCH',
}

export interface PolyglotAstTranspilerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PolyglotAstTranspilerConfig {
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
  thresholds: PolyglotAstTranspilerThresholds;
}

export interface PolyglotAstTranspilerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PolyglotAstTranspilerState;
  severity: PolyglotAstTranspilerSeverity;
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

export interface PolyglotAstTranspilerMetricSnapshot {
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

export interface PolyglotAstTranspilerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PolyglotAstTranspilerState;
  severity?: PolyglotAstTranspilerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PolyglotAstTranspilerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PolyglotAstTranspilerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PolyglotAstTranspilerAuditEvent {
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

export interface PolyglotAstTranspilerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PolyglotAstTranspilerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PolyglotAstTranspilerSubscriberCallback {
  (record: PolyglotAstTranspilerRecord): void | Promise<void>;
}

export class PolyglotAstTranspilerException extends Error {
  constructor(
    public readonly code: PolyglotAstTranspilerErrorCode | string,
    message: string,
    public readonly severity: PolyglotAstTranspilerSeverity = PolyglotAstTranspilerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PolyglotAstTranspilerException';
  }
}

