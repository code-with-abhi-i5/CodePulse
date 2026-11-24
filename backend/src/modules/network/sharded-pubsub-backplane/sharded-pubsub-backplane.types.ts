/**
 * @file sharded-pubsub-backplane.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-SHARD-CHANNEL-089]: Sharded WebSocket Room Pub/Sub Backplane with Multi-Node Redis Cluster Streams.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ShardedPubSubBackplaneState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ShardedPubSubBackplaneSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ShardedPubSubBackplaneErrorCode {
  RECORD_NOT_FOUND = 'SHARDEDPUBSUBBACKPLANE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SHARDEDPUBSUBBACKPLANE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SHARDEDPUBSUBBACKPLANE_EMPTY_PAYLOAD',
  INVALID_STATE = 'SHARDEDPUBSUBBACKPLANE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SHARDEDPUBSUBBACKPLANE_CAPACITY_EXCEEDED',
  TIMEOUT = 'SHARDEDPUBSUBBACKPLANE_TIMEOUT',
  SECURITY_VIOLATION = 'SHARDEDPUBSUBBACKPLANE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SHARDEDPUBSUBBACKPLANE_CHECKSUM_MISMATCH',
}

export interface ShardedPubSubBackplaneThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ShardedPubSubBackplaneConfig {
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
  thresholds: ShardedPubSubBackplaneThresholds;
}

export interface ShardedPubSubBackplaneRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ShardedPubSubBackplaneState;
  severity: ShardedPubSubBackplaneSeverity;
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

export interface ShardedPubSubBackplaneMetricSnapshot {
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

export interface ShardedPubSubBackplaneFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ShardedPubSubBackplaneState;
  severity?: ShardedPubSubBackplaneSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ShardedPubSubBackplaneHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ShardedPubSubBackplaneState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ShardedPubSubBackplaneAuditEvent {
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

export interface ShardedPubSubBackplaneBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ShardedPubSubBackplaneRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ShardedPubSubBackplaneSubscriberCallback {
  (record: ShardedPubSubBackplaneRecord): void | Promise<void>;
}

export class ShardedPubSubBackplaneException extends Error {
  constructor(
    public readonly code: ShardedPubSubBackplaneErrorCode | string,
    message: string,
    public readonly severity: ShardedPubSubBackplaneSeverity = ShardedPubSubBackplaneSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ShardedPubSubBackplaneException';
  }
}

