/**
 * @file spectator-hype-aggregator.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-HYPE-088]: Real-Time Spectator Hype Meter Stream Aggregator with Redis HyperLogLog & Stream Decay.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SpectatorHypeAggregatorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SpectatorHypeAggregatorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SpectatorHypeAggregatorErrorCode {
  RECORD_NOT_FOUND = 'SPECTATORHYPEAGGREGATOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SPECTATORHYPEAGGREGATOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SPECTATORHYPEAGGREGATOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'SPECTATORHYPEAGGREGATOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SPECTATORHYPEAGGREGATOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'SPECTATORHYPEAGGREGATOR_TIMEOUT',
  SECURITY_VIOLATION = 'SPECTATORHYPEAGGREGATOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SPECTATORHYPEAGGREGATOR_CHECKSUM_MISMATCH',
}

export interface SpectatorHypeAggregatorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SpectatorHypeAggregatorConfig {
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
  thresholds: SpectatorHypeAggregatorThresholds;
}

export interface SpectatorHypeAggregatorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SpectatorHypeAggregatorState;
  severity: SpectatorHypeAggregatorSeverity;
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

export interface SpectatorHypeAggregatorMetricSnapshot {
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

export interface SpectatorHypeAggregatorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SpectatorHypeAggregatorState;
  severity?: SpectatorHypeAggregatorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SpectatorHypeAggregatorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SpectatorHypeAggregatorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SpectatorHypeAggregatorAuditEvent {
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

export interface SpectatorHypeAggregatorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SpectatorHypeAggregatorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SpectatorHypeAggregatorSubscriberCallback {
  (record: SpectatorHypeAggregatorRecord): void | Promise<void>;
}

export class SpectatorHypeAggregatorException extends Error {
  constructor(
    public readonly code: SpectatorHypeAggregatorErrorCode | string,
    message: string,
    public readonly severity: SpectatorHypeAggregatorSeverity = SpectatorHypeAggregatorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SpectatorHypeAggregatorException';
  }
}

