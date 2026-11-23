/**
 * @file sse-token-multiplexer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-STREAM-062]: Server-Sent Events (SSE) LLM Token Multiplexer with Predictive Backpressure & Cancellation.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SseTokenMultiplexerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SseTokenMultiplexerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SseTokenMultiplexerErrorCode {
  RECORD_NOT_FOUND = 'SSETOKENMULTIPLEXER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SSETOKENMULTIPLEXER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SSETOKENMULTIPLEXER_EMPTY_PAYLOAD',
  INVALID_STATE = 'SSETOKENMULTIPLEXER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SSETOKENMULTIPLEXER_CAPACITY_EXCEEDED',
  TIMEOUT = 'SSETOKENMULTIPLEXER_TIMEOUT',
  SECURITY_VIOLATION = 'SSETOKENMULTIPLEXER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SSETOKENMULTIPLEXER_CHECKSUM_MISMATCH',
}

export interface SseTokenMultiplexerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SseTokenMultiplexerConfig {
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
  thresholds: SseTokenMultiplexerThresholds;
}

export interface SseTokenMultiplexerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SseTokenMultiplexerState;
  severity: SseTokenMultiplexerSeverity;
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

export interface SseTokenMultiplexerMetricSnapshot {
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

export interface SseTokenMultiplexerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SseTokenMultiplexerState;
  severity?: SseTokenMultiplexerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SseTokenMultiplexerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SseTokenMultiplexerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SseTokenMultiplexerAuditEvent {
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

export interface SseTokenMultiplexerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SseTokenMultiplexerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SseTokenMultiplexerSubscriberCallback {
  (record: SseTokenMultiplexerRecord): void | Promise<void>;
}

export class SseTokenMultiplexerException extends Error {
  constructor(
    public readonly code: SseTokenMultiplexerErrorCode | string,
    message: string,
    public readonly severity: SseTokenMultiplexerSeverity = SseTokenMultiplexerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SseTokenMultiplexerException';
  }
}

