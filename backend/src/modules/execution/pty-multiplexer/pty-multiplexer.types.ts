/**
 * @file pty-multiplexer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-PTY-050]: High-Performance Pseudo-Terminal (PTY) Multiplexer with ANSI/VT100 Escape Parser.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PtyMultiplexerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PtyMultiplexerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PtyMultiplexerErrorCode {
  RECORD_NOT_FOUND = 'PTYMULTIPLEXER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'PTYMULTIPLEXER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'PTYMULTIPLEXER_EMPTY_PAYLOAD',
  INVALID_STATE = 'PTYMULTIPLEXER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'PTYMULTIPLEXER_CAPACITY_EXCEEDED',
  TIMEOUT = 'PTYMULTIPLEXER_TIMEOUT',
  SECURITY_VIOLATION = 'PTYMULTIPLEXER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'PTYMULTIPLEXER_CHECKSUM_MISMATCH',
}

export interface PtyMultiplexerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PtyMultiplexerConfig {
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
  thresholds: PtyMultiplexerThresholds;
}

export interface PtyMultiplexerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PtyMultiplexerState;
  severity: PtyMultiplexerSeverity;
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

export interface PtyMultiplexerMetricSnapshot {
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

export interface PtyMultiplexerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PtyMultiplexerState;
  severity?: PtyMultiplexerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PtyMultiplexerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PtyMultiplexerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PtyMultiplexerAuditEvent {
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

export interface PtyMultiplexerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PtyMultiplexerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PtyMultiplexerSubscriberCallback {
  (record: PtyMultiplexerRecord): void | Promise<void>;
}

export class PtyMultiplexerException extends Error {
  constructor(
    public readonly code: PtyMultiplexerErrorCode | string,
    message: string,
    public readonly severity: PtyMultiplexerSeverity = PtyMultiplexerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PtyMultiplexerException';
  }
}

