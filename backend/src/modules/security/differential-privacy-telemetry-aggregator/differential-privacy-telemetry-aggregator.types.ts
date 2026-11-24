/**
 * @file differential-privacy-telemetry-aggregator.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-DIFF-PRIVACY-106]: Differential Privacy Telemetry Aggregator Injecting Calibrated Laplace Noise on Analytics.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DifferentialPrivacyTelemetryAggregatorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DifferentialPrivacyTelemetryAggregatorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DifferentialPrivacyTelemetryAggregatorErrorCode {
  RECORD_NOT_FOUND = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_TIMEOUT',
  SECURITY_VIOLATION = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DIFFERENTIALPRIVACYTELEMETRYAGGREGATOR_CHECKSUM_MISMATCH',
}

export interface DifferentialPrivacyTelemetryAggregatorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DifferentialPrivacyTelemetryAggregatorConfig {
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
  thresholds: DifferentialPrivacyTelemetryAggregatorThresholds;
}

export interface DifferentialPrivacyTelemetryAggregatorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DifferentialPrivacyTelemetryAggregatorState;
  severity: DifferentialPrivacyTelemetryAggregatorSeverity;
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

export interface DifferentialPrivacyTelemetryAggregatorMetricSnapshot {
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

export interface DifferentialPrivacyTelemetryAggregatorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DifferentialPrivacyTelemetryAggregatorState;
  severity?: DifferentialPrivacyTelemetryAggregatorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DifferentialPrivacyTelemetryAggregatorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DifferentialPrivacyTelemetryAggregatorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DifferentialPrivacyTelemetryAggregatorAuditEvent {
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

export interface DifferentialPrivacyTelemetryAggregatorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DifferentialPrivacyTelemetryAggregatorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DifferentialPrivacyTelemetryAggregatorSubscriberCallback {
  (record: DifferentialPrivacyTelemetryAggregatorRecord): void | Promise<void>;
}

export class DifferentialPrivacyTelemetryAggregatorException extends Error {
  constructor(
    public readonly code: DifferentialPrivacyTelemetryAggregatorErrorCode | string,
    message: string,
    public readonly severity: DifferentialPrivacyTelemetryAggregatorSeverity = DifferentialPrivacyTelemetryAggregatorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DifferentialPrivacyTelemetryAggregatorException';
  }
}

