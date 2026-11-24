/**
 * @file webauthn-fido2-passkey-server.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-PASSKEY-107]: WebAuthn / FIDO2 Passkey Server with Cryptographic Biometric Challenge Verification.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebauthnFido2PasskeyServerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebauthnFido2PasskeyServerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebauthnFido2PasskeyServerErrorCode {
  RECORD_NOT_FOUND = 'WEBAUTHNFIDO2PASSKEYSERVER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBAUTHNFIDO2PASSKEYSERVER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBAUTHNFIDO2PASSKEYSERVER_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBAUTHNFIDO2PASSKEYSERVER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBAUTHNFIDO2PASSKEYSERVER_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBAUTHNFIDO2PASSKEYSERVER_TIMEOUT',
  SECURITY_VIOLATION = 'WEBAUTHNFIDO2PASSKEYSERVER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBAUTHNFIDO2PASSKEYSERVER_CHECKSUM_MISMATCH',
}

export interface WebauthnFido2PasskeyServerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebauthnFido2PasskeyServerConfig {
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
  thresholds: WebauthnFido2PasskeyServerThresholds;
}

export interface WebauthnFido2PasskeyServerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebauthnFido2PasskeyServerState;
  severity: WebauthnFido2PasskeyServerSeverity;
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

export interface WebauthnFido2PasskeyServerMetricSnapshot {
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

export interface WebauthnFido2PasskeyServerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebauthnFido2PasskeyServerState;
  severity?: WebauthnFido2PasskeyServerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebauthnFido2PasskeyServerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebauthnFido2PasskeyServerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebauthnFido2PasskeyServerAuditEvent {
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

export interface WebauthnFido2PasskeyServerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebauthnFido2PasskeyServerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebauthnFido2PasskeyServerSubscriberCallback {
  (record: WebauthnFido2PasskeyServerRecord): void | Promise<void>;
}

export class WebauthnFido2PasskeyServerException extends Error {
  constructor(
    public readonly code: WebauthnFido2PasskeyServerErrorCode | string,
    message: string,
    public readonly severity: WebauthnFido2PasskeyServerSeverity = WebauthnFido2PasskeyServerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebauthnFido2PasskeyServerException';
  }
}

