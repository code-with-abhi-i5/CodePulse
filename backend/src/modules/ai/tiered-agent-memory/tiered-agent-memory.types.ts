/**
 * @file tiered-agent-memory.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-MEMORY-076]: Tiered AI Agent Memory Store Combining Short-Term Ephemeral Buffer & Long-Term Vector Recall.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum TieredAgentMemoryState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum TieredAgentMemorySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum TieredAgentMemoryErrorCode {
  RECORD_NOT_FOUND = 'TIEREDAGENTMEMORY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'TIEREDAGENTMEMORY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'TIEREDAGENTMEMORY_EMPTY_PAYLOAD',
  INVALID_STATE = 'TIEREDAGENTMEMORY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'TIEREDAGENTMEMORY_CAPACITY_EXCEEDED',
  TIMEOUT = 'TIEREDAGENTMEMORY_TIMEOUT',
  SECURITY_VIOLATION = 'TIEREDAGENTMEMORY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'TIEREDAGENTMEMORY_CHECKSUM_MISMATCH',
}

export interface TieredAgentMemoryThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface TieredAgentMemoryConfig {
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
  thresholds: TieredAgentMemoryThresholds;
}

export interface TieredAgentMemoryRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: TieredAgentMemoryState;
  severity: TieredAgentMemorySeverity;
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

export interface TieredAgentMemoryMetricSnapshot {
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

export interface TieredAgentMemoryFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: TieredAgentMemoryState;
  severity?: TieredAgentMemorySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TieredAgentMemoryHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: TieredAgentMemoryState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface TieredAgentMemoryAuditEvent {
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

export interface TieredAgentMemoryBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: TieredAgentMemoryRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface TieredAgentMemorySubscriberCallback {
  (record: TieredAgentMemoryRecord): void | Promise<void>;
}

export class TieredAgentMemoryException extends Error {
  constructor(
    public readonly code: TieredAgentMemoryErrorCode | string,
    message: string,
    public readonly severity: TieredAgentMemorySeverity = TieredAgentMemorySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'TieredAgentMemoryException';
  }
}

