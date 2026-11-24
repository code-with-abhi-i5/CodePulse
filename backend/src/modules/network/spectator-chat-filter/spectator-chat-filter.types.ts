/**
 * @file spectator-chat-filter.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-CHAT-FILTER-096]: Sub-Millisecond Spectator Battle Chat Filter with C-Based Bloom Filter & Regex Trie.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SpectatorChatFilterState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SpectatorChatFilterSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SpectatorChatFilterErrorCode {
  RECORD_NOT_FOUND = 'SPECTATORCHATFILTER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SPECTATORCHATFILTER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SPECTATORCHATFILTER_EMPTY_PAYLOAD',
  INVALID_STATE = 'SPECTATORCHATFILTER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SPECTATORCHATFILTER_CAPACITY_EXCEEDED',
  TIMEOUT = 'SPECTATORCHATFILTER_TIMEOUT',
  SECURITY_VIOLATION = 'SPECTATORCHATFILTER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SPECTATORCHATFILTER_CHECKSUM_MISMATCH',
}

export interface SpectatorChatFilterThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SpectatorChatFilterConfig {
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
  thresholds: SpectatorChatFilterThresholds;
}

export interface SpectatorChatFilterRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SpectatorChatFilterState;
  severity: SpectatorChatFilterSeverity;
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

export interface SpectatorChatFilterMetricSnapshot {
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

export interface SpectatorChatFilterFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SpectatorChatFilterState;
  severity?: SpectatorChatFilterSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SpectatorChatFilterHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SpectatorChatFilterState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SpectatorChatFilterAuditEvent {
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

export interface SpectatorChatFilterBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SpectatorChatFilterRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SpectatorChatFilterSubscriberCallback {
  (record: SpectatorChatFilterRecord): void | Promise<void>;
}

export class SpectatorChatFilterException extends Error {
  constructor(
    public readonly code: SpectatorChatFilterErrorCode | string,
    message: string,
    public readonly severity: SpectatorChatFilterSeverity = SpectatorChatFilterSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SpectatorChatFilterException';
  }
}

