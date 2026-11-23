/**
 * @file boundary-test-synthesizer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-TESTGEN-064]: Dynamic Boundary Condition Test Suite Synthesizer with Coverage-Guided Fuzzing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum BoundaryTestSynthesizerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum BoundaryTestSynthesizerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum BoundaryTestSynthesizerErrorCode {
  RECORD_NOT_FOUND = 'BOUNDARYTESTSYNTHESIZER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'BOUNDARYTESTSYNTHESIZER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'BOUNDARYTESTSYNTHESIZER_EMPTY_PAYLOAD',
  INVALID_STATE = 'BOUNDARYTESTSYNTHESIZER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'BOUNDARYTESTSYNTHESIZER_CAPACITY_EXCEEDED',
  TIMEOUT = 'BOUNDARYTESTSYNTHESIZER_TIMEOUT',
  SECURITY_VIOLATION = 'BOUNDARYTESTSYNTHESIZER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'BOUNDARYTESTSYNTHESIZER_CHECKSUM_MISMATCH',
}

export interface BoundaryTestSynthesizerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface BoundaryTestSynthesizerConfig {
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
  thresholds: BoundaryTestSynthesizerThresholds;
}

export interface BoundaryTestSynthesizerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: BoundaryTestSynthesizerState;
  severity: BoundaryTestSynthesizerSeverity;
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

export interface BoundaryTestSynthesizerMetricSnapshot {
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

export interface BoundaryTestSynthesizerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: BoundaryTestSynthesizerState;
  severity?: BoundaryTestSynthesizerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BoundaryTestSynthesizerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: BoundaryTestSynthesizerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface BoundaryTestSynthesizerAuditEvent {
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

export interface BoundaryTestSynthesizerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: BoundaryTestSynthesizerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface BoundaryTestSynthesizerSubscriberCallback {
  (record: BoundaryTestSynthesizerRecord): void | Promise<void>;
}

export class BoundaryTestSynthesizerException extends Error {
  constructor(
    public readonly code: BoundaryTestSynthesizerErrorCode | string,
    message: string,
    public readonly severity: BoundaryTestSynthesizerSeverity = BoundaryTestSynthesizerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'BoundaryTestSynthesizerException';
  }
}

