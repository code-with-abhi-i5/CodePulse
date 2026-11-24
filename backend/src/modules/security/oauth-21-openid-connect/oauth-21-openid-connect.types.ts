/**
 * @file oauth-21-openid-connect.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-PKCE-114]: OAuth 2.1 & OpenID Connect (OIDC) Identity Provider with Cryptographic PKCE Enforcement.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum Oauth21OpenidConnectState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum Oauth21OpenidConnectSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum Oauth21OpenidConnectErrorCode {
  RECORD_NOT_FOUND = 'OAUTH21OPENIDCONNECT_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'OAUTH21OPENIDCONNECT_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'OAUTH21OPENIDCONNECT_EMPTY_PAYLOAD',
  INVALID_STATE = 'OAUTH21OPENIDCONNECT_INVALID_STATE',
  CAPACITY_EXCEEDED = 'OAUTH21OPENIDCONNECT_CAPACITY_EXCEEDED',
  TIMEOUT = 'OAUTH21OPENIDCONNECT_TIMEOUT',
  SECURITY_VIOLATION = 'OAUTH21OPENIDCONNECT_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'OAUTH21OPENIDCONNECT_CHECKSUM_MISMATCH',
}

export interface Oauth21OpenidConnectThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface Oauth21OpenidConnectConfig {
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
  thresholds: Oauth21OpenidConnectThresholds;
}

export interface Oauth21OpenidConnectRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: Oauth21OpenidConnectState;
  severity: Oauth21OpenidConnectSeverity;
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

export interface Oauth21OpenidConnectMetricSnapshot {
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

export interface Oauth21OpenidConnectFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: Oauth21OpenidConnectState;
  severity?: Oauth21OpenidConnectSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface Oauth21OpenidConnectHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: Oauth21OpenidConnectState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface Oauth21OpenidConnectAuditEvent {
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

export interface Oauth21OpenidConnectBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: Oauth21OpenidConnectRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface Oauth21OpenidConnectSubscriberCallback {
  (record: Oauth21OpenidConnectRecord): void | Promise<void>;
}

export class Oauth21OpenidConnectException extends Error {
  constructor(
    public readonly code: Oauth21OpenidConnectErrorCode | string,
    message: string,
    public readonly severity: Oauth21OpenidConnectSeverity = Oauth21OpenidConnectSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'Oauth21OpenidConnectException';
  }
}

