/**
 * @file hierarchical-token-budgeter.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-TOKEN-BUDGET-072]: Hierarchical Token Budgeter & Quota Governor with Sliding-Window Organization Caps.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum HierarchicalTokenBudgeterState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum HierarchicalTokenBudgeterSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum HierarchicalTokenBudgeterErrorCode {
  RECORD_NOT_FOUND = 'HIERARCHICALTOKENBUDGETER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'HIERARCHICALTOKENBUDGETER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'HIERARCHICALTOKENBUDGETER_EMPTY_PAYLOAD',
  INVALID_STATE = 'HIERARCHICALTOKENBUDGETER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'HIERARCHICALTOKENBUDGETER_CAPACITY_EXCEEDED',
  TIMEOUT = 'HIERARCHICALTOKENBUDGETER_TIMEOUT',
  SECURITY_VIOLATION = 'HIERARCHICALTOKENBUDGETER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'HIERARCHICALTOKENBUDGETER_CHECKSUM_MISMATCH',
}

export interface HierarchicalTokenBudgeterThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface HierarchicalTokenBudgeterConfig {
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
  thresholds: HierarchicalTokenBudgeterThresholds;
}

export interface HierarchicalTokenBudgeterRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: HierarchicalTokenBudgeterState;
  severity: HierarchicalTokenBudgeterSeverity;
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

export interface HierarchicalTokenBudgeterMetricSnapshot {
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

export interface HierarchicalTokenBudgeterFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: HierarchicalTokenBudgeterState;
  severity?: HierarchicalTokenBudgeterSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface HierarchicalTokenBudgeterHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: HierarchicalTokenBudgeterState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface HierarchicalTokenBudgeterAuditEvent {
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

export interface HierarchicalTokenBudgeterBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: HierarchicalTokenBudgeterRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface HierarchicalTokenBudgeterSubscriberCallback {
  (record: HierarchicalTokenBudgeterRecord): void | Promise<void>;
}

export class HierarchicalTokenBudgeterException extends Error {
  constructor(
    public readonly code: HierarchicalTokenBudgeterErrorCode | string,
    message: string,
    public readonly severity: HierarchicalTokenBudgeterSeverity = HierarchicalTokenBudgeterSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'HierarchicalTokenBudgeterException';
  }
}

