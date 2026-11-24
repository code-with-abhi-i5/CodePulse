/**
 * @file websocket-backpressure-monitor.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-BACKPRESSURE-086]: WebSocket Buffer Backpressure Monitor with Automatic Event-Loop Throttle Dampening.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebSocketBackpressureMonitorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebSocketBackpressureMonitorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebSocketBackpressureMonitorErrorCode {
  RECORD_NOT_FOUND = 'WEBSOCKETBACKPRESSUREMONITOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBSOCKETBACKPRESSUREMONITOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBSOCKETBACKPRESSUREMONITOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBSOCKETBACKPRESSUREMONITOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBSOCKETBACKPRESSUREMONITOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBSOCKETBACKPRESSUREMONITOR_TIMEOUT',
  SECURITY_VIOLATION = 'WEBSOCKETBACKPRESSUREMONITOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBSOCKETBACKPRESSUREMONITOR_CHECKSUM_MISMATCH',
}

export interface WebSocketBackpressureMonitorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebSocketBackpressureMonitorConfig {
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
  thresholds: WebSocketBackpressureMonitorThresholds;
}

export interface WebSocketBackpressureMonitorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebSocketBackpressureMonitorState;
  severity: WebSocketBackpressureMonitorSeverity;
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

export interface WebSocketBackpressureMonitorMetricSnapshot {
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

export interface WebSocketBackpressureMonitorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebSocketBackpressureMonitorState;
  severity?: WebSocketBackpressureMonitorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebSocketBackpressureMonitorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebSocketBackpressureMonitorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebSocketBackpressureMonitorAuditEvent {
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

export interface WebSocketBackpressureMonitorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebSocketBackpressureMonitorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebSocketBackpressureMonitorSubscriberCallback {
  (record: WebSocketBackpressureMonitorRecord): void | Promise<void>;
}

export class WebSocketBackpressureMonitorException extends Error {
  constructor(
    public readonly code: WebSocketBackpressureMonitorErrorCode | string,
    message: string,
    public readonly severity: WebSocketBackpressureMonitorSeverity = WebSocketBackpressureMonitorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebSocketBackpressureMonitorException';
  }
}

