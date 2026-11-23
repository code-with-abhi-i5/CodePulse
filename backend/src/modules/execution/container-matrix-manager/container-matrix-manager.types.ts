/**
 * @file container-matrix-manager.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-CONTAINER-MATRIX-060]: Polyglot Compiler Toolchain Matrix Manager with Pre-Cached Container Base Layers.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ContainerMatrixManagerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ContainerMatrixManagerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ContainerMatrixManagerErrorCode {
  RECORD_NOT_FOUND = 'CONTAINERMATRIXMANAGER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CONTAINERMATRIXMANAGER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CONTAINERMATRIXMANAGER_EMPTY_PAYLOAD',
  INVALID_STATE = 'CONTAINERMATRIXMANAGER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CONTAINERMATRIXMANAGER_CAPACITY_EXCEEDED',
  TIMEOUT = 'CONTAINERMATRIXMANAGER_TIMEOUT',
  SECURITY_VIOLATION = 'CONTAINERMATRIXMANAGER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CONTAINERMATRIXMANAGER_CHECKSUM_MISMATCH',
}

export interface ContainerMatrixManagerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ContainerMatrixManagerConfig {
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
  thresholds: ContainerMatrixManagerThresholds;
}

export interface ContainerMatrixManagerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ContainerMatrixManagerState;
  severity: ContainerMatrixManagerSeverity;
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

export interface ContainerMatrixManagerMetricSnapshot {
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

export interface ContainerMatrixManagerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ContainerMatrixManagerState;
  severity?: ContainerMatrixManagerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ContainerMatrixManagerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ContainerMatrixManagerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ContainerMatrixManagerAuditEvent {
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

export interface ContainerMatrixManagerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ContainerMatrixManagerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ContainerMatrixManagerSubscriberCallback {
  (record: ContainerMatrixManagerRecord): void | Promise<void>;
}

export class ContainerMatrixManagerException extends Error {
  constructor(
    public readonly code: ContainerMatrixManagerErrorCode | string,
    message: string,
    public readonly severity: ContainerMatrixManagerSeverity = ContainerMatrixManagerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ContainerMatrixManagerException';
  }
}

