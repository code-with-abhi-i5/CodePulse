/**
 * @file caster-studio-multiplexer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-CASTER-STUDIO-097]: Live Esports Multi-Perspective Caster Studio with Hotkey Video & Code Feed Switching.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CasterStudioMultiplexerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CasterStudioMultiplexerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CasterStudioMultiplexerErrorCode {
  RECORD_NOT_FOUND = 'CASTERSTUDIOMULTIPLEXER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CASTERSTUDIOMULTIPLEXER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CASTERSTUDIOMULTIPLEXER_EMPTY_PAYLOAD',
  INVALID_STATE = 'CASTERSTUDIOMULTIPLEXER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CASTERSTUDIOMULTIPLEXER_CAPACITY_EXCEEDED',
  TIMEOUT = 'CASTERSTUDIOMULTIPLEXER_TIMEOUT',
  SECURITY_VIOLATION = 'CASTERSTUDIOMULTIPLEXER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CASTERSTUDIOMULTIPLEXER_CHECKSUM_MISMATCH',
}

export interface CasterStudioMultiplexerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CasterStudioMultiplexerConfig {
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
  thresholds: CasterStudioMultiplexerThresholds;
}

export interface CasterStudioMultiplexerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CasterStudioMultiplexerState;
  severity: CasterStudioMultiplexerSeverity;
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

export interface CasterStudioMultiplexerMetricSnapshot {
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

export interface CasterStudioMultiplexerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CasterStudioMultiplexerState;
  severity?: CasterStudioMultiplexerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CasterStudioMultiplexerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CasterStudioMultiplexerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CasterStudioMultiplexerAuditEvent {
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

export interface CasterStudioMultiplexerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CasterStudioMultiplexerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CasterStudioMultiplexerSubscriberCallback {
  (record: CasterStudioMultiplexerRecord): void | Promise<void>;
}

export class CasterStudioMultiplexerException extends Error {
  constructor(
    public readonly code: CasterStudioMultiplexerErrorCode | string,
    message: string,
    public readonly severity: CasterStudioMultiplexerSeverity = CasterStudioMultiplexerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CasterStudioMultiplexerException';
  }
}

