/**
 * @file hardened-flag-injector.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-FLAGS-054]: Dynamic Hardened Compiler Flag Injector Defending Against ROP/JOP Binary Exploits.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum HardenedFlagInjectorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum HardenedFlagInjectorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum HardenedFlagInjectorErrorCode {
  RECORD_NOT_FOUND = 'HARDENEDFLAGINJECTOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'HARDENEDFLAGINJECTOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'HARDENEDFLAGINJECTOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'HARDENEDFLAGINJECTOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'HARDENEDFLAGINJECTOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'HARDENEDFLAGINJECTOR_TIMEOUT',
  SECURITY_VIOLATION = 'HARDENEDFLAGINJECTOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'HARDENEDFLAGINJECTOR_CHECKSUM_MISMATCH',
}

export interface HardenedFlagInjectorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface HardenedFlagInjectorConfig {
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
  thresholds: HardenedFlagInjectorThresholds;
}

export interface HardenedFlagInjectorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: HardenedFlagInjectorState;
  severity: HardenedFlagInjectorSeverity;
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

export interface HardenedFlagInjectorMetricSnapshot {
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

export interface HardenedFlagInjectorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: HardenedFlagInjectorState;
  severity?: HardenedFlagInjectorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface HardenedFlagInjectorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: HardenedFlagInjectorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface HardenedFlagInjectorAuditEvent {
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

export interface HardenedFlagInjectorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: HardenedFlagInjectorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface HardenedFlagInjectorSubscriberCallback {
  (record: HardenedFlagInjectorRecord): void | Promise<void>;
}

export class HardenedFlagInjectorException extends Error {
  constructor(
    public readonly code: HardenedFlagInjectorErrorCode | string,
    message: string,
    public readonly severity: HardenedFlagInjectorSeverity = HardenedFlagInjectorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'HardenedFlagInjectorException';
  }
}

