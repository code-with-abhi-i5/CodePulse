/**
 * @file websocket-migration-orchestrator.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-MIGRATION-100]: Live WebSocket Connection Handshake Migration for Zero-Disconnect Pod Rolling Restarts.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebSocketMigrationOrchestratorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebSocketMigrationOrchestratorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebSocketMigrationOrchestratorErrorCode {
  RECORD_NOT_FOUND = 'WEBSOCKETMIGRATIONORCHESTRATOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBSOCKETMIGRATIONORCHESTRATOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBSOCKETMIGRATIONORCHESTRATOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBSOCKETMIGRATIONORCHESTRATOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBSOCKETMIGRATIONORCHESTRATOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBSOCKETMIGRATIONORCHESTRATOR_TIMEOUT',
  SECURITY_VIOLATION = 'WEBSOCKETMIGRATIONORCHESTRATOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBSOCKETMIGRATIONORCHESTRATOR_CHECKSUM_MISMATCH',
}

export interface WebSocketMigrationOrchestratorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebSocketMigrationOrchestratorConfig {
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
  thresholds: WebSocketMigrationOrchestratorThresholds;
}

export interface WebSocketMigrationOrchestratorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebSocketMigrationOrchestratorState;
  severity: WebSocketMigrationOrchestratorSeverity;
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

export interface WebSocketMigrationOrchestratorMetricSnapshot {
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

export interface WebSocketMigrationOrchestratorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebSocketMigrationOrchestratorState;
  severity?: WebSocketMigrationOrchestratorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebSocketMigrationOrchestratorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebSocketMigrationOrchestratorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebSocketMigrationOrchestratorAuditEvent {
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

export interface WebSocketMigrationOrchestratorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebSocketMigrationOrchestratorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebSocketMigrationOrchestratorSubscriberCallback {
  (record: WebSocketMigrationOrchestratorRecord): void | Promise<void>;
}

export class WebSocketMigrationOrchestratorException extends Error {
  constructor(
    public readonly code: WebSocketMigrationOrchestratorErrorCode | string,
    message: string,
    public readonly severity: WebSocketMigrationOrchestratorSeverity = WebSocketMigrationOrchestratorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebSocketMigrationOrchestratorException';
  }
}

