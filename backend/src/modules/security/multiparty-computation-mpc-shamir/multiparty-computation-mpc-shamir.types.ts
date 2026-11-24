/**
 * @file multiparty-computation-mpc-shamir.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-MPC-103]: Multi-Party Computation (MPC) Shamir Secret Sharing Key Vault for Zero-Trust Signing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum MultipartyComputationMpcShamirState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum MultipartyComputationMpcShamirSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum MultipartyComputationMpcShamirErrorCode {
  RECORD_NOT_FOUND = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_EMPTY_PAYLOAD',
  INVALID_STATE = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_CAPACITY_EXCEEDED',
  TIMEOUT = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_TIMEOUT',
  SECURITY_VIOLATION = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'MULTIPARTYCOMPUTATIONMPCSHAMIR_CHECKSUM_MISMATCH',
}

export interface MultipartyComputationMpcShamirThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface MultipartyComputationMpcShamirConfig {
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
  thresholds: MultipartyComputationMpcShamirThresholds;
}

export interface MultipartyComputationMpcShamirRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: MultipartyComputationMpcShamirState;
  severity: MultipartyComputationMpcShamirSeverity;
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

export interface MultipartyComputationMpcShamirMetricSnapshot {
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

export interface MultipartyComputationMpcShamirFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: MultipartyComputationMpcShamirState;
  severity?: MultipartyComputationMpcShamirSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface MultipartyComputationMpcShamirHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: MultipartyComputationMpcShamirState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface MultipartyComputationMpcShamirAuditEvent {
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

export interface MultipartyComputationMpcShamirBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: MultipartyComputationMpcShamirRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface MultipartyComputationMpcShamirSubscriberCallback {
  (record: MultipartyComputationMpcShamirRecord): void | Promise<void>;
}

export class MultipartyComputationMpcShamirException extends Error {
  constructor(
    public readonly code: MultipartyComputationMpcShamirErrorCode | string,
    message: string,
    public readonly severity: MultipartyComputationMpcShamirSeverity = MultipartyComputationMpcShamirSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'MultipartyComputationMpcShamirException';
  }
}

