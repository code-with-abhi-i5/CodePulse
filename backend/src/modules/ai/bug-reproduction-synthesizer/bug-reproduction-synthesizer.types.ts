/**
 * @file bug-reproduction-synthesizer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-REPRO-066]: Automated Bug Reproduction Script Synthesizer from Unstructured GitHub Issues.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum BugReproductionSynthesizerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum BugReproductionSynthesizerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum BugReproductionSynthesizerErrorCode {
  RECORD_NOT_FOUND = 'BUGREPRODUCTIONSYNTHESIZER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'BUGREPRODUCTIONSYNTHESIZER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'BUGREPRODUCTIONSYNTHESIZER_EMPTY_PAYLOAD',
  INVALID_STATE = 'BUGREPRODUCTIONSYNTHESIZER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'BUGREPRODUCTIONSYNTHESIZER_CAPACITY_EXCEEDED',
  TIMEOUT = 'BUGREPRODUCTIONSYNTHESIZER_TIMEOUT',
  SECURITY_VIOLATION = 'BUGREPRODUCTIONSYNTHESIZER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'BUGREPRODUCTIONSYNTHESIZER_CHECKSUM_MISMATCH',
}

export interface BugReproductionSynthesizerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface BugReproductionSynthesizerConfig {
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
  thresholds: BugReproductionSynthesizerThresholds;
}

export interface BugReproductionSynthesizerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: BugReproductionSynthesizerState;
  severity: BugReproductionSynthesizerSeverity;
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

export interface BugReproductionSynthesizerMetricSnapshot {
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

export interface BugReproductionSynthesizerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: BugReproductionSynthesizerState;
  severity?: BugReproductionSynthesizerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BugReproductionSynthesizerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: BugReproductionSynthesizerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface BugReproductionSynthesizerAuditEvent {
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

export interface BugReproductionSynthesizerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: BugReproductionSynthesizerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface BugReproductionSynthesizerSubscriberCallback {
  (record: BugReproductionSynthesizerRecord): void | Promise<void>;
}

export class BugReproductionSynthesizerException extends Error {
  constructor(
    public readonly code: BugReproductionSynthesizerErrorCode | string,
    message: string,
    public readonly severity: BugReproductionSynthesizerSeverity = BugReproductionSynthesizerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'BugReproductionSynthesizerException';
  }
}

