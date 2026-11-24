/**
 * @file ephemeral-spiffespire-mutual-tls.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-MTLS-109]: Ephemeral SPIFFE/SPIRE Mutual TLS (mTLS) Certificate Authority for Microservice Zero-Trust.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum EphemeralSpiffespireMutualTlsState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum EphemeralSpiffespireMutualTlsSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum EphemeralSpiffespireMutualTlsErrorCode {
  RECORD_NOT_FOUND = 'EPHEMERALSPIFFESPIREMUTUALTLS_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'EPHEMERALSPIFFESPIREMUTUALTLS_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'EPHEMERALSPIFFESPIREMUTUALTLS_EMPTY_PAYLOAD',
  INVALID_STATE = 'EPHEMERALSPIFFESPIREMUTUALTLS_INVALID_STATE',
  CAPACITY_EXCEEDED = 'EPHEMERALSPIFFESPIREMUTUALTLS_CAPACITY_EXCEEDED',
  TIMEOUT = 'EPHEMERALSPIFFESPIREMUTUALTLS_TIMEOUT',
  SECURITY_VIOLATION = 'EPHEMERALSPIFFESPIREMUTUALTLS_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'EPHEMERALSPIFFESPIREMUTUALTLS_CHECKSUM_MISMATCH',
}

export interface EphemeralSpiffespireMutualTlsThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface EphemeralSpiffespireMutualTlsConfig {
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
  thresholds: EphemeralSpiffespireMutualTlsThresholds;
}

export interface EphemeralSpiffespireMutualTlsRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: EphemeralSpiffespireMutualTlsState;
  severity: EphemeralSpiffespireMutualTlsSeverity;
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

export interface EphemeralSpiffespireMutualTlsMetricSnapshot {
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

export interface EphemeralSpiffespireMutualTlsFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: EphemeralSpiffespireMutualTlsState;
  severity?: EphemeralSpiffespireMutualTlsSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface EphemeralSpiffespireMutualTlsHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: EphemeralSpiffespireMutualTlsState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface EphemeralSpiffespireMutualTlsAuditEvent {
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

export interface EphemeralSpiffespireMutualTlsBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: EphemeralSpiffespireMutualTlsRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface EphemeralSpiffespireMutualTlsSubscriberCallback {
  (record: EphemeralSpiffespireMutualTlsRecord): void | Promise<void>;
}

export class EphemeralSpiffespireMutualTlsException extends Error {
  constructor(
    public readonly code: EphemeralSpiffespireMutualTlsErrorCode | string,
    message: string,
    public readonly severity: EphemeralSpiffespireMutualTlsSeverity = EphemeralSpiffespireMutualTlsSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'EphemeralSpiffespireMutualTlsException';
  }
}

