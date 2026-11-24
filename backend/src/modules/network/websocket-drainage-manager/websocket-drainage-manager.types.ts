/**
 * @file websocket-drainage-manager.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-DRAIN-084]: Zero-Downtime WebSocket Socket Rebalancing & Graceful Connection Drainage on Cloud Deployments.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebSocketDrainageManagerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebSocketDrainageManagerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebSocketDrainageManagerErrorCode {
  RECORD_NOT_FOUND = 'WEBSOCKETDRAINAGEMANAGER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBSOCKETDRAINAGEMANAGER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBSOCKETDRAINAGEMANAGER_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBSOCKETDRAINAGEMANAGER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBSOCKETDRAINAGEMANAGER_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBSOCKETDRAINAGEMANAGER_TIMEOUT',
  SECURITY_VIOLATION = 'WEBSOCKETDRAINAGEMANAGER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBSOCKETDRAINAGEMANAGER_CHECKSUM_MISMATCH',
}

export interface WebSocketDrainageManagerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebSocketDrainageManagerConfig {
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
  thresholds: WebSocketDrainageManagerThresholds;
}

export interface WebSocketDrainageManagerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebSocketDrainageManagerState;
  severity: WebSocketDrainageManagerSeverity;
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

export interface WebSocketDrainageManagerMetricSnapshot {
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

export interface WebSocketDrainageManagerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebSocketDrainageManagerState;
  severity?: WebSocketDrainageManagerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebSocketDrainageManagerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebSocketDrainageManagerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebSocketDrainageManagerAuditEvent {
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

export interface WebSocketDrainageManagerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebSocketDrainageManagerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebSocketDrainageManagerSubscriberCallback {
  (record: WebSocketDrainageManagerRecord): void | Promise<void>;
}

export class WebSocketDrainageManagerException extends Error {
  constructor(
    public readonly code: WebSocketDrainageManagerErrorCode | string,
    message: string,
    public readonly severity: WebSocketDrainageManagerSeverity = WebSocketDrainageManagerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebSocketDrainageManagerException';
  }
}

