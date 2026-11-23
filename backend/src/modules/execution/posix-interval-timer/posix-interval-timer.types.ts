/**
 * @file posix-interval-timer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-POSIX-TIMER-053]: Microsecond Precision POSIX Interval Timer & SIGXCPU Timeout Guard for Untrusted Runtimes.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PosixIntervalTimerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PosixIntervalTimerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PosixIntervalTimerErrorCode {
  RECORD_NOT_FOUND = 'POSIXINTERVALTIMER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'POSIXINTERVALTIMER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'POSIXINTERVALTIMER_EMPTY_PAYLOAD',
  INVALID_STATE = 'POSIXINTERVALTIMER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'POSIXINTERVALTIMER_CAPACITY_EXCEEDED',
  TIMEOUT = 'POSIXINTERVALTIMER_TIMEOUT',
  SECURITY_VIOLATION = 'POSIXINTERVALTIMER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'POSIXINTERVALTIMER_CHECKSUM_MISMATCH',
}

export interface PosixIntervalTimerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PosixIntervalTimerConfig {
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
  thresholds: PosixIntervalTimerThresholds;
}

export interface PosixIntervalTimerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PosixIntervalTimerState;
  severity: PosixIntervalTimerSeverity;
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

export interface PosixIntervalTimerMetricSnapshot {
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

export interface PosixIntervalTimerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PosixIntervalTimerState;
  severity?: PosixIntervalTimerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PosixIntervalTimerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PosixIntervalTimerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PosixIntervalTimerAuditEvent {
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

export interface PosixIntervalTimerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PosixIntervalTimerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PosixIntervalTimerSubscriberCallback {
  (record: PosixIntervalTimerRecord): void | Promise<void>;
}

export class PosixIntervalTimerException extends Error {
  constructor(
    public readonly code: PosixIntervalTimerErrorCode | string,
    message: string,
    public readonly severity: PosixIntervalTimerSeverity = PosixIntervalTimerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PosixIntervalTimerException';
  }
}

