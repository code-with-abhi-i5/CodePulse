/**
 * @file distributed-ip-penalty-box.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-PENALTY-BOX-117]: Distributed IP Penalty Box & Sliding-Window Exponential Tarpit Defense for Brute Force.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DistributedIpPenaltyBoxState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DistributedIpPenaltyBoxSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DistributedIpPenaltyBoxErrorCode {
  RECORD_NOT_FOUND = 'DISTRIBUTEDIPPENALTYBOX_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DISTRIBUTEDIPPENALTYBOX_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DISTRIBUTEDIPPENALTYBOX_EMPTY_PAYLOAD',
  INVALID_STATE = 'DISTRIBUTEDIPPENALTYBOX_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DISTRIBUTEDIPPENALTYBOX_CAPACITY_EXCEEDED',
  TIMEOUT = 'DISTRIBUTEDIPPENALTYBOX_TIMEOUT',
  SECURITY_VIOLATION = 'DISTRIBUTEDIPPENALTYBOX_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DISTRIBUTEDIPPENALTYBOX_CHECKSUM_MISMATCH',
}

export interface DistributedIpPenaltyBoxThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DistributedIpPenaltyBoxConfig {
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
  thresholds: DistributedIpPenaltyBoxThresholds;
}

export interface DistributedIpPenaltyBoxRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DistributedIpPenaltyBoxState;
  severity: DistributedIpPenaltyBoxSeverity;
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

export interface DistributedIpPenaltyBoxMetricSnapshot {
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

export interface DistributedIpPenaltyBoxFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DistributedIpPenaltyBoxState;
  severity?: DistributedIpPenaltyBoxSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DistributedIpPenaltyBoxHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DistributedIpPenaltyBoxState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DistributedIpPenaltyBoxAuditEvent {
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

export interface DistributedIpPenaltyBoxBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DistributedIpPenaltyBoxRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DistributedIpPenaltyBoxSubscriberCallback {
  (record: DistributedIpPenaltyBoxRecord): void | Promise<void>;
}

export class DistributedIpPenaltyBoxException extends Error {
  constructor(
    public readonly code: DistributedIpPenaltyBoxErrorCode | string,
    message: string,
    public readonly severity: DistributedIpPenaltyBoxSeverity = DistributedIpPenaltyBoxSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DistributedIpPenaltyBoxException';
  }
}

