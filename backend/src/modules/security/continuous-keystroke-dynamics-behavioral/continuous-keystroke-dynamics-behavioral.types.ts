/**
 * @file continuous-keystroke-dynamics-behavioral.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-BIOMETRICS-115]: Continuous Keystroke Dynamics Behavioral Biometrics Authentication Engine.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ContinuousKeystrokeDynamicsBehavioralState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ContinuousKeystrokeDynamicsBehavioralSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ContinuousKeystrokeDynamicsBehavioralErrorCode {
  RECORD_NOT_FOUND = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_EMPTY_PAYLOAD',
  INVALID_STATE = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_CAPACITY_EXCEEDED',
  TIMEOUT = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_TIMEOUT',
  SECURITY_VIOLATION = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CONTINUOUSKEYSTROKEDYNAMICSBEHAVIORAL_CHECKSUM_MISMATCH',
}

export interface ContinuousKeystrokeDynamicsBehavioralThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ContinuousKeystrokeDynamicsBehavioralConfig {
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
  thresholds: ContinuousKeystrokeDynamicsBehavioralThresholds;
}

export interface ContinuousKeystrokeDynamicsBehavioralRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ContinuousKeystrokeDynamicsBehavioralState;
  severity: ContinuousKeystrokeDynamicsBehavioralSeverity;
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

export interface ContinuousKeystrokeDynamicsBehavioralMetricSnapshot {
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

export interface ContinuousKeystrokeDynamicsBehavioralFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ContinuousKeystrokeDynamicsBehavioralState;
  severity?: ContinuousKeystrokeDynamicsBehavioralSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ContinuousKeystrokeDynamicsBehavioralHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ContinuousKeystrokeDynamicsBehavioralState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ContinuousKeystrokeDynamicsBehavioralAuditEvent {
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

export interface ContinuousKeystrokeDynamicsBehavioralBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ContinuousKeystrokeDynamicsBehavioralRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ContinuousKeystrokeDynamicsBehavioralSubscriberCallback {
  (record: ContinuousKeystrokeDynamicsBehavioralRecord): void | Promise<void>;
}

export class ContinuousKeystrokeDynamicsBehavioralException extends Error {
  constructor(
    public readonly code: ContinuousKeystrokeDynamicsBehavioralErrorCode | string,
    message: string,
    public readonly severity: ContinuousKeystrokeDynamicsBehavioralSeverity = ContinuousKeystrokeDynamicsBehavioralSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ContinuousKeystrokeDynamicsBehavioralException';
  }
}

