/**
 * @file deterministic-runner.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-DETERMINISTIC-055]: Deterministic Execution Runner with Virtual Clock & Entropy Seeding for Reproducible Tests.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DeterministicRunnerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DeterministicRunnerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DeterministicRunnerErrorCode {
  RECORD_NOT_FOUND = 'DETERMINISTICRUNNER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DETERMINISTICRUNNER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DETERMINISTICRUNNER_EMPTY_PAYLOAD',
  INVALID_STATE = 'DETERMINISTICRUNNER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DETERMINISTICRUNNER_CAPACITY_EXCEEDED',
  TIMEOUT = 'DETERMINISTICRUNNER_TIMEOUT',
  SECURITY_VIOLATION = 'DETERMINISTICRUNNER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DETERMINISTICRUNNER_CHECKSUM_MISMATCH',
}

export interface DeterministicRunnerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DeterministicRunnerConfig {
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
  thresholds: DeterministicRunnerThresholds;
}

export interface DeterministicRunnerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DeterministicRunnerState;
  severity: DeterministicRunnerSeverity;
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

export interface DeterministicRunnerMetricSnapshot {
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

export interface DeterministicRunnerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DeterministicRunnerState;
  severity?: DeterministicRunnerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeterministicRunnerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DeterministicRunnerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DeterministicRunnerAuditEvent {
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

export interface DeterministicRunnerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DeterministicRunnerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DeterministicRunnerSubscriberCallback {
  (record: DeterministicRunnerRecord): void | Promise<void>;
}

export class DeterministicRunnerException extends Error {
  constructor(
    public readonly code: DeterministicRunnerErrorCode | string,
    message: string,
    public readonly severity: DeterministicRunnerSeverity = DeterministicRunnerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DeterministicRunnerException';
  }
}

