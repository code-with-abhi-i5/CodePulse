/**
 * @file ast-pre-screener.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-AST-SCREEN-057]: Static Analysis AST Pre-Screener Rejecting Malicious System Imports & Native Module Bypasses.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AstPreScreenerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AstPreScreenerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AstPreScreenerErrorCode {
  RECORD_NOT_FOUND = 'ASTPRESCREENER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ASTPRESCREENER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ASTPRESCREENER_EMPTY_PAYLOAD',
  INVALID_STATE = 'ASTPRESCREENER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ASTPRESCREENER_CAPACITY_EXCEEDED',
  TIMEOUT = 'ASTPRESCREENER_TIMEOUT',
  SECURITY_VIOLATION = 'ASTPRESCREENER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ASTPRESCREENER_CHECKSUM_MISMATCH',
}

export interface AstPreScreenerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AstPreScreenerConfig {
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
  thresholds: AstPreScreenerThresholds;
}

export interface AstPreScreenerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AstPreScreenerState;
  severity: AstPreScreenerSeverity;
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

export interface AstPreScreenerMetricSnapshot {
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

export interface AstPreScreenerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AstPreScreenerState;
  severity?: AstPreScreenerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AstPreScreenerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AstPreScreenerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AstPreScreenerAuditEvent {
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

export interface AstPreScreenerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AstPreScreenerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AstPreScreenerSubscriberCallback {
  (record: AstPreScreenerRecord): void | Promise<void>;
}

export class AstPreScreenerException extends Error {
  constructor(
    public readonly code: AstPreScreenerErrorCode | string,
    message: string,
    public readonly severity: AstPreScreenerSeverity = AstPreScreenerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AstPreScreenerException';
  }
}

