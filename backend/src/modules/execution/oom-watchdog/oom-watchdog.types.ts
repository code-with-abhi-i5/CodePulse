/**
 * @file oom-watchdog.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-OOM-047]: Real-Time Execution Memory Leak & Heap Explosion Early-Warning Watchdog.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum OomWatchdogState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum OomWatchdogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum OomWatchdogErrorCode {
  RECORD_NOT_FOUND = 'OOMWATCHDOG_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'OOMWATCHDOG_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'OOMWATCHDOG_EMPTY_PAYLOAD',
  INVALID_STATE = 'OOMWATCHDOG_INVALID_STATE',
  CAPACITY_EXCEEDED = 'OOMWATCHDOG_CAPACITY_EXCEEDED',
  TIMEOUT = 'OOMWATCHDOG_TIMEOUT',
  SECURITY_VIOLATION = 'OOMWATCHDOG_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'OOMWATCHDOG_CHECKSUM_MISMATCH',
}

export interface OomWatchdogThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface OomWatchdogConfig {
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
  thresholds: OomWatchdogThresholds;
}

export interface OomWatchdogRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: OomWatchdogState;
  severity: OomWatchdogSeverity;
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

export interface OomWatchdogMetricSnapshot {
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

export interface OomWatchdogFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: OomWatchdogState;
  severity?: OomWatchdogSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface OomWatchdogHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: OomWatchdogState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface OomWatchdogAuditEvent {
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

export interface OomWatchdogBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: OomWatchdogRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface OomWatchdogSubscriberCallback {
  (record: OomWatchdogRecord): void | Promise<void>;
}

export class OomWatchdogException extends Error {
  constructor(
    public readonly code: OomWatchdogErrorCode | string,
    message: string,
    public readonly severity: OomWatchdogSeverity = OomWatchdogSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'OomWatchdogException';
  }
}

