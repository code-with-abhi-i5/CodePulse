/**
 * @file cryptographic-w3c-verifiable-credential.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-VC-BADGE-112]: Cryptographic W3C Verifiable Credential Badge Exporter with ECDSA Signatures & QR Code.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CryptographicW3cVerifiableCredentialState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CryptographicW3cVerifiableCredentialSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CryptographicW3cVerifiableCredentialErrorCode {
  RECORD_NOT_FOUND = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_EMPTY_PAYLOAD',
  INVALID_STATE = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_CAPACITY_EXCEEDED',
  TIMEOUT = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_TIMEOUT',
  SECURITY_VIOLATION = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CRYPTOGRAPHICW3CVERIFIABLECREDENTIAL_CHECKSUM_MISMATCH',
}

export interface CryptographicW3cVerifiableCredentialThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CryptographicW3cVerifiableCredentialConfig {
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
  thresholds: CryptographicW3cVerifiableCredentialThresholds;
}

export interface CryptographicW3cVerifiableCredentialRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CryptographicW3cVerifiableCredentialState;
  severity: CryptographicW3cVerifiableCredentialSeverity;
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

export interface CryptographicW3cVerifiableCredentialMetricSnapshot {
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

export interface CryptographicW3cVerifiableCredentialFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CryptographicW3cVerifiableCredentialState;
  severity?: CryptographicW3cVerifiableCredentialSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CryptographicW3cVerifiableCredentialHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CryptographicW3cVerifiableCredentialState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CryptographicW3cVerifiableCredentialAuditEvent {
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

export interface CryptographicW3cVerifiableCredentialBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CryptographicW3cVerifiableCredentialRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CryptographicW3cVerifiableCredentialSubscriberCallback {
  (record: CryptographicW3cVerifiableCredentialRecord): void | Promise<void>;
}

export class CryptographicW3cVerifiableCredentialException extends Error {
  constructor(
    public readonly code: CryptographicW3cVerifiableCredentialErrorCode | string,
    message: string,
    public readonly severity: CryptographicW3cVerifiableCredentialSeverity = CryptographicW3cVerifiableCredentialSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CryptographicW3cVerifiableCredentialException';
  }
}

