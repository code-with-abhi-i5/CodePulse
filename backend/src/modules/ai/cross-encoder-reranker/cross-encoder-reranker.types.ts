/**
 * @file cross-encoder-reranker.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-RERANKER-077]: Cross-Encoder Codebase Embedding Reranker for High-Precision Symbol Resolution.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CrossEncoderRerankerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CrossEncoderRerankerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CrossEncoderRerankerErrorCode {
  RECORD_NOT_FOUND = 'CROSSENCODERRERANKER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CROSSENCODERRERANKER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CROSSENCODERRERANKER_EMPTY_PAYLOAD',
  INVALID_STATE = 'CROSSENCODERRERANKER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CROSSENCODERRERANKER_CAPACITY_EXCEEDED',
  TIMEOUT = 'CROSSENCODERRERANKER_TIMEOUT',
  SECURITY_VIOLATION = 'CROSSENCODERRERANKER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CROSSENCODERRERANKER_CHECKSUM_MISMATCH',
}

export interface CrossEncoderRerankerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CrossEncoderRerankerConfig {
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
  thresholds: CrossEncoderRerankerThresholds;
}

export interface CrossEncoderRerankerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CrossEncoderRerankerState;
  severity: CrossEncoderRerankerSeverity;
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

export interface CrossEncoderRerankerMetricSnapshot {
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

export interface CrossEncoderRerankerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CrossEncoderRerankerState;
  severity?: CrossEncoderRerankerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CrossEncoderRerankerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CrossEncoderRerankerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CrossEncoderRerankerAuditEvent {
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

export interface CrossEncoderRerankerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CrossEncoderRerankerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CrossEncoderRerankerSubscriberCallback {
  (record: CrossEncoderRerankerRecord): void | Promise<void>;
}

export class CrossEncoderRerankerException extends Error {
  constructor(
    public readonly code: CrossEncoderRerankerErrorCode | string,
    message: string,
    public readonly severity: CrossEncoderRerankerSeverity = CrossEncoderRerankerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CrossEncoderRerankerException';
  }
}

