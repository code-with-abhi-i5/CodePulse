/**
 * @file highspeed-git-commit-secret.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-SECRET-SCAN-116]: High-Speed Git Commit Secret Scanner with High-Entropy Detection & AST Regex Rules.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum HighspeedGitCommitSecretState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum HighspeedGitCommitSecretSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum HighspeedGitCommitSecretErrorCode {
  RECORD_NOT_FOUND = 'HIGHSPEEDGITCOMMITSECRET_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'HIGHSPEEDGITCOMMITSECRET_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'HIGHSPEEDGITCOMMITSECRET_EMPTY_PAYLOAD',
  INVALID_STATE = 'HIGHSPEEDGITCOMMITSECRET_INVALID_STATE',
  CAPACITY_EXCEEDED = 'HIGHSPEEDGITCOMMITSECRET_CAPACITY_EXCEEDED',
  TIMEOUT = 'HIGHSPEEDGITCOMMITSECRET_TIMEOUT',
  SECURITY_VIOLATION = 'HIGHSPEEDGITCOMMITSECRET_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'HIGHSPEEDGITCOMMITSECRET_CHECKSUM_MISMATCH',
}

export interface HighspeedGitCommitSecretThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface HighspeedGitCommitSecretConfig {
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
  thresholds: HighspeedGitCommitSecretThresholds;
}

export interface HighspeedGitCommitSecretRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: HighspeedGitCommitSecretState;
  severity: HighspeedGitCommitSecretSeverity;
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

export interface HighspeedGitCommitSecretMetricSnapshot {
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

export interface HighspeedGitCommitSecretFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: HighspeedGitCommitSecretState;
  severity?: HighspeedGitCommitSecretSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface HighspeedGitCommitSecretHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: HighspeedGitCommitSecretState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface HighspeedGitCommitSecretAuditEvent {
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

export interface HighspeedGitCommitSecretBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: HighspeedGitCommitSecretRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface HighspeedGitCommitSecretSubscriberCallback {
  (record: HighspeedGitCommitSecretRecord): void | Promise<void>;
}

export class HighspeedGitCommitSecretException extends Error {
  constructor(
    public readonly code: HighspeedGitCommitSecretErrorCode | string,
    message: string,
    public readonly severity: HighspeedGitCommitSecretSeverity = HighspeedGitCommitSecretSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'HighspeedGitCommitSecretException';
  }
}

