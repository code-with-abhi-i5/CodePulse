/**
 * @file zerodowntime-dualkey-signing-automated.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-KEY-ROTATION-110]: Zero-Downtime Dual-Key Signing & Automated JWT Key Rotation Pipeline.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ZerodowntimeDualkeySigningAutomatedState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ZerodowntimeDualkeySigningAutomatedSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ZerodowntimeDualkeySigningAutomatedErrorCode {
  RECORD_NOT_FOUND = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_EMPTY_PAYLOAD',
  INVALID_STATE = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_CAPACITY_EXCEEDED',
  TIMEOUT = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_TIMEOUT',
  SECURITY_VIOLATION = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ZERODOWNTIMEDUALKEYSIGNINGAUTOMATED_CHECKSUM_MISMATCH',
}

export interface ZerodowntimeDualkeySigningAutomatedThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ZerodowntimeDualkeySigningAutomatedConfig {
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
  thresholds: ZerodowntimeDualkeySigningAutomatedThresholds;
}

export interface ZerodowntimeDualkeySigningAutomatedRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ZerodowntimeDualkeySigningAutomatedState;
  severity: ZerodowntimeDualkeySigningAutomatedSeverity;
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

export interface ZerodowntimeDualkeySigningAutomatedMetricSnapshot {
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

export interface ZerodowntimeDualkeySigningAutomatedFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ZerodowntimeDualkeySigningAutomatedState;
  severity?: ZerodowntimeDualkeySigningAutomatedSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ZerodowntimeDualkeySigningAutomatedHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ZerodowntimeDualkeySigningAutomatedState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ZerodowntimeDualkeySigningAutomatedAuditEvent {
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

export interface ZerodowntimeDualkeySigningAutomatedBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ZerodowntimeDualkeySigningAutomatedRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ZerodowntimeDualkeySigningAutomatedSubscriberCallback {
  (record: ZerodowntimeDualkeySigningAutomatedRecord): void | Promise<void>;
}

export class ZerodowntimeDualkeySigningAutomatedException extends Error {
  constructor(
    public readonly code: ZerodowntimeDualkeySigningAutomatedErrorCode | string,
    message: string,
    public readonly severity: ZerodowntimeDualkeySigningAutomatedSeverity = ZerodowntimeDualkeySigningAutomatedSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ZerodowntimeDualkeySigningAutomatedException';
  }
}

