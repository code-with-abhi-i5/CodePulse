/**
 * @file distributed-deadletter-queue-dlq.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [EVENT-DLQ-123]: Distributed Dead-Letter Queue (DLQ) Automated Poison-Pill Isolator & Replay Engine.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DistributedDeadletterQueueDlqState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DistributedDeadletterQueueDlqSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DistributedDeadletterQueueDlqErrorCode {
  RECORD_NOT_FOUND = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_EMPTY_PAYLOAD',
  INVALID_STATE = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_CAPACITY_EXCEEDED',
  TIMEOUT = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_TIMEOUT',
  SECURITY_VIOLATION = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DISTRIBUTEDDEADLETTERQUEUEDLQ_CHECKSUM_MISMATCH',
}

export interface DistributedDeadletterQueueDlqThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DistributedDeadletterQueueDlqConfig {
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
  thresholds: DistributedDeadletterQueueDlqThresholds;
}

export interface DistributedDeadletterQueueDlqRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DistributedDeadletterQueueDlqState;
  severity: DistributedDeadletterQueueDlqSeverity;
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

export interface DistributedDeadletterQueueDlqMetricSnapshot {
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

export interface DistributedDeadletterQueueDlqFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DistributedDeadletterQueueDlqState;
  severity?: DistributedDeadletterQueueDlqSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DistributedDeadletterQueueDlqHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DistributedDeadletterQueueDlqState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DistributedDeadletterQueueDlqAuditEvent {
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

export interface DistributedDeadletterQueueDlqBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DistributedDeadletterQueueDlqRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DistributedDeadletterQueueDlqSubscriberCallback {
  (record: DistributedDeadletterQueueDlqRecord): void | Promise<void>;
}

export class DistributedDeadletterQueueDlqException extends Error {
  constructor(
    public readonly code: DistributedDeadletterQueueDlqErrorCode | string,
    message: string,
    public readonly severity: DistributedDeadletterQueueDlqSeverity = DistributedDeadletterQueueDlqSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DistributedDeadletterQueueDlqException';
  }
}

