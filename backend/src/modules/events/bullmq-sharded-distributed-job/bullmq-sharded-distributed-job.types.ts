/**
 * @file bullmq-sharded-distributed-job.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [EVENT-BULLMQ-124]: BullMQ Sharded Distributed Job Scheduler with Redis Cluster Lock Isolation.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum BullmqShardedDistributedJobState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum BullmqShardedDistributedJobSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum BullmqShardedDistributedJobErrorCode {
  RECORD_NOT_FOUND = 'BULLMQSHARDEDDISTRIBUTEDJOB_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'BULLMQSHARDEDDISTRIBUTEDJOB_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'BULLMQSHARDEDDISTRIBUTEDJOB_EMPTY_PAYLOAD',
  INVALID_STATE = 'BULLMQSHARDEDDISTRIBUTEDJOB_INVALID_STATE',
  CAPACITY_EXCEEDED = 'BULLMQSHARDEDDISTRIBUTEDJOB_CAPACITY_EXCEEDED',
  TIMEOUT = 'BULLMQSHARDEDDISTRIBUTEDJOB_TIMEOUT',
  SECURITY_VIOLATION = 'BULLMQSHARDEDDISTRIBUTEDJOB_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'BULLMQSHARDEDDISTRIBUTEDJOB_CHECKSUM_MISMATCH',
}

export interface BullmqShardedDistributedJobThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface BullmqShardedDistributedJobConfig {
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
  thresholds: BullmqShardedDistributedJobThresholds;
}

export interface BullmqShardedDistributedJobRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: BullmqShardedDistributedJobState;
  severity: BullmqShardedDistributedJobSeverity;
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

export interface BullmqShardedDistributedJobMetricSnapshot {
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

export interface BullmqShardedDistributedJobFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: BullmqShardedDistributedJobState;
  severity?: BullmqShardedDistributedJobSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BullmqShardedDistributedJobHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: BullmqShardedDistributedJobState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface BullmqShardedDistributedJobAuditEvent {
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

export interface BullmqShardedDistributedJobBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: BullmqShardedDistributedJobRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface BullmqShardedDistributedJobSubscriberCallback {
  (record: BullmqShardedDistributedJobRecord): void | Promise<void>;
}

export class BullmqShardedDistributedJobException extends Error {
  constructor(
    public readonly code: BullmqShardedDistributedJobErrorCode | string,
    message: string,
    public readonly severity: BullmqShardedDistributedJobSeverity = BullmqShardedDistributedJobSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'BullmqShardedDistributedJobException';
  }
}

