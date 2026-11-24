/**
 * @file delta-compression-scrubber.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-SCRUBBER-091]: Lossless Delta Compression Scrubber for Instantaneous Keystroke State Reconstruction.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DeltaCompressionScrubberState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DeltaCompressionScrubberSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DeltaCompressionScrubberErrorCode {
  RECORD_NOT_FOUND = 'DELTACOMPRESSIONSCRUBBER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DELTACOMPRESSIONSCRUBBER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DELTACOMPRESSIONSCRUBBER_EMPTY_PAYLOAD',
  INVALID_STATE = 'DELTACOMPRESSIONSCRUBBER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DELTACOMPRESSIONSCRUBBER_CAPACITY_EXCEEDED',
  TIMEOUT = 'DELTACOMPRESSIONSCRUBBER_TIMEOUT',
  SECURITY_VIOLATION = 'DELTACOMPRESSIONSCRUBBER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DELTACOMPRESSIONSCRUBBER_CHECKSUM_MISMATCH',
}

export interface DeltaCompressionScrubberThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DeltaCompressionScrubberConfig {
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
  thresholds: DeltaCompressionScrubberThresholds;
}

export interface DeltaCompressionScrubberRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DeltaCompressionScrubberState;
  severity: DeltaCompressionScrubberSeverity;
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

export interface DeltaCompressionScrubberMetricSnapshot {
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

export interface DeltaCompressionScrubberFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DeltaCompressionScrubberState;
  severity?: DeltaCompressionScrubberSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeltaCompressionScrubberHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DeltaCompressionScrubberState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DeltaCompressionScrubberAuditEvent {
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

export interface DeltaCompressionScrubberBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DeltaCompressionScrubberRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DeltaCompressionScrubberSubscriberCallback {
  (record: DeltaCompressionScrubberRecord): void | Promise<void>;
}

export class DeltaCompressionScrubberException extends Error {
  constructor(
    public readonly code: DeltaCompressionScrubberErrorCode | string,
    message: string,
    public readonly severity: DeltaCompressionScrubberSeverity = DeltaCompressionScrubberSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DeltaCompressionScrubberException';
  }
}

