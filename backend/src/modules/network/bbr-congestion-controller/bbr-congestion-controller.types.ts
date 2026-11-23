/**
 * @file bbr-congestion-controller.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-BBR-090]: WebTransport Congestion Control Tuning (BBRv2) for High-Jitter Esports Broadcast Feeds.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum BbrCongestionControllerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum BbrCongestionControllerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum BbrCongestionControllerErrorCode {
  RECORD_NOT_FOUND = 'BBRCONGESTIONCONTROLLER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'BBRCONGESTIONCONTROLLER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'BBRCONGESTIONCONTROLLER_EMPTY_PAYLOAD',
  INVALID_STATE = 'BBRCONGESTIONCONTROLLER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'BBRCONGESTIONCONTROLLER_CAPACITY_EXCEEDED',
  TIMEOUT = 'BBRCONGESTIONCONTROLLER_TIMEOUT',
  SECURITY_VIOLATION = 'BBRCONGESTIONCONTROLLER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'BBRCONGESTIONCONTROLLER_CHECKSUM_MISMATCH',
}

export interface BbrCongestionControllerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface BbrCongestionControllerConfig {
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
  thresholds: BbrCongestionControllerThresholds;
}

export interface BbrCongestionControllerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: BbrCongestionControllerState;
  severity: BbrCongestionControllerSeverity;
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

export interface BbrCongestionControllerMetricSnapshot {
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

export interface BbrCongestionControllerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: BbrCongestionControllerState;
  severity?: BbrCongestionControllerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BbrCongestionControllerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: BbrCongestionControllerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface BbrCongestionControllerAuditEvent {
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

export interface BbrCongestionControllerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: BbrCongestionControllerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface BbrCongestionControllerSubscriberCallback {
  (record: BbrCongestionControllerRecord): void | Promise<void>;
}

export class BbrCongestionControllerException extends Error {
  constructor(
    public readonly code: BbrCongestionControllerErrorCode | string,
    message: string,
    public readonly severity: BbrCongestionControllerSeverity = BbrCongestionControllerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'BbrCongestionControllerException';
  }
}

