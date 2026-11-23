/**
 * @file rollback-netcode-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-ROLLBACK-082]: GGPO-Style Rollback Netcode Engine with Client-Side Frame Prediction Under 150ms+ Lag.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum RollbackNetcodeEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum RollbackNetcodeEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum RollbackNetcodeEngineErrorCode {
  RECORD_NOT_FOUND = 'ROLLBACKNETCODEENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ROLLBACKNETCODEENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ROLLBACKNETCODEENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'ROLLBACKNETCODEENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ROLLBACKNETCODEENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'ROLLBACKNETCODEENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'ROLLBACKNETCODEENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ROLLBACKNETCODEENGINE_CHECKSUM_MISMATCH',
}

export interface RollbackNetcodeEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface RollbackNetcodeEngineConfig {
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
  thresholds: RollbackNetcodeEngineThresholds;
}

export interface RollbackNetcodeEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: RollbackNetcodeEngineState;
  severity: RollbackNetcodeEngineSeverity;
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

export interface RollbackNetcodeEngineMetricSnapshot {
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

export interface RollbackNetcodeEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: RollbackNetcodeEngineState;
  severity?: RollbackNetcodeEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface RollbackNetcodeEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: RollbackNetcodeEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface RollbackNetcodeEngineAuditEvent {
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

export interface RollbackNetcodeEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: RollbackNetcodeEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface RollbackNetcodeEngineSubscriberCallback {
  (record: RollbackNetcodeEngineRecord): void | Promise<void>;
}

export class RollbackNetcodeEngineException extends Error {
  constructor(
    public readonly code: RollbackNetcodeEngineErrorCode | string,
    message: string,
    public readonly severity: RollbackNetcodeEngineSeverity = RollbackNetcodeEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'RollbackNetcodeEngineException';
  }
}

