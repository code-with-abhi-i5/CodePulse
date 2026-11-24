/**
 * @file turn-server-pool-allocator.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-TURN-093]: Automated Coturn STUN/TURN Server Pool Allocator with Geo-DNS Health Probing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum TurnServerPoolAllocatorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum TurnServerPoolAllocatorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum TurnServerPoolAllocatorErrorCode {
  RECORD_NOT_FOUND = 'TURNSERVERPOOLALLOCATOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'TURNSERVERPOOLALLOCATOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'TURNSERVERPOOLALLOCATOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'TURNSERVERPOOLALLOCATOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'TURNSERVERPOOLALLOCATOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'TURNSERVERPOOLALLOCATOR_TIMEOUT',
  SECURITY_VIOLATION = 'TURNSERVERPOOLALLOCATOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'TURNSERVERPOOLALLOCATOR_CHECKSUM_MISMATCH',
}

export interface TurnServerPoolAllocatorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface TurnServerPoolAllocatorConfig {
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
  thresholds: TurnServerPoolAllocatorThresholds;
}

export interface TurnServerPoolAllocatorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: TurnServerPoolAllocatorState;
  severity: TurnServerPoolAllocatorSeverity;
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

export interface TurnServerPoolAllocatorMetricSnapshot {
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

export interface TurnServerPoolAllocatorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: TurnServerPoolAllocatorState;
  severity?: TurnServerPoolAllocatorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TurnServerPoolAllocatorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: TurnServerPoolAllocatorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface TurnServerPoolAllocatorAuditEvent {
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

export interface TurnServerPoolAllocatorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: TurnServerPoolAllocatorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface TurnServerPoolAllocatorSubscriberCallback {
  (record: TurnServerPoolAllocatorRecord): void | Promise<void>;
}

export class TurnServerPoolAllocatorException extends Error {
  constructor(
    public readonly code: TurnServerPoolAllocatorErrorCode | string,
    message: string,
    public readonly severity: TurnServerPoolAllocatorSeverity = TurnServerPoolAllocatorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'TurnServerPoolAllocatorException';
  }
}

