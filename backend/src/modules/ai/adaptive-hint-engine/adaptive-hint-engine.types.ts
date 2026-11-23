/**
 * @file adaptive-hint-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-HINTS-067]: Adaptive Progressive Hint Generation Engine with Levenshtein-Distance Keystroke Tracking.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AdaptiveHintEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AdaptiveHintEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AdaptiveHintEngineErrorCode {
  RECORD_NOT_FOUND = 'ADAPTIVEHINTENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ADAPTIVEHINTENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ADAPTIVEHINTENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'ADAPTIVEHINTENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ADAPTIVEHINTENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'ADAPTIVEHINTENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'ADAPTIVEHINTENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ADAPTIVEHINTENGINE_CHECKSUM_MISMATCH',
}

export interface AdaptiveHintEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AdaptiveHintEngineConfig {
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
  thresholds: AdaptiveHintEngineThresholds;
}

export interface AdaptiveHintEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AdaptiveHintEngineState;
  severity: AdaptiveHintEngineSeverity;
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

export interface AdaptiveHintEngineMetricSnapshot {
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

export interface AdaptiveHintEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AdaptiveHintEngineState;
  severity?: AdaptiveHintEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AdaptiveHintEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AdaptiveHintEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AdaptiveHintEngineAuditEvent {
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

export interface AdaptiveHintEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AdaptiveHintEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AdaptiveHintEngineSubscriberCallback {
  (record: AdaptiveHintEngineRecord): void | Promise<void>;
}

export class AdaptiveHintEngineException extends Error {
  constructor(
    public readonly code: AdaptiveHintEngineErrorCode | string,
    message: string,
    public readonly severity: AdaptiveHintEngineSeverity = AdaptiveHintEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AdaptiveHintEngineException';
  }
}

