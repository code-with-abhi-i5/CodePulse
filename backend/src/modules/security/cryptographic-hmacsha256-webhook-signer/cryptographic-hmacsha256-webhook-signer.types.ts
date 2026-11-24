/**
 * @file cryptographic-hmacsha256-webhook-signer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-HMAC-WEBHOOK-118]: Cryptographic HMAC-SHA256 Webhook Signer with Timestamp Replay Attack Prevention.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CryptographicHmacsha256WebhookSignerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CryptographicHmacsha256WebhookSignerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CryptographicHmacsha256WebhookSignerErrorCode {
  RECORD_NOT_FOUND = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_EMPTY_PAYLOAD',
  INVALID_STATE = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_CAPACITY_EXCEEDED',
  TIMEOUT = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_TIMEOUT',
  SECURITY_VIOLATION = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CRYPTOGRAPHICHMACSHA256WEBHOOKSIGNER_CHECKSUM_MISMATCH',
}

export interface CryptographicHmacsha256WebhookSignerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CryptographicHmacsha256WebhookSignerConfig {
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
  thresholds: CryptographicHmacsha256WebhookSignerThresholds;
}

export interface CryptographicHmacsha256WebhookSignerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CryptographicHmacsha256WebhookSignerState;
  severity: CryptographicHmacsha256WebhookSignerSeverity;
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

export interface CryptographicHmacsha256WebhookSignerMetricSnapshot {
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

export interface CryptographicHmacsha256WebhookSignerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CryptographicHmacsha256WebhookSignerState;
  severity?: CryptographicHmacsha256WebhookSignerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CryptographicHmacsha256WebhookSignerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CryptographicHmacsha256WebhookSignerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CryptographicHmacsha256WebhookSignerAuditEvent {
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

export interface CryptographicHmacsha256WebhookSignerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CryptographicHmacsha256WebhookSignerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CryptographicHmacsha256WebhookSignerSubscriberCallback {
  (record: CryptographicHmacsha256WebhookSignerRecord): void | Promise<void>;
}

export class CryptographicHmacsha256WebhookSignerException extends Error {
  constructor(
    public readonly code: CryptographicHmacsha256WebhookSignerErrorCode | string,
    message: string,
    public readonly severity: CryptographicHmacsha256WebhookSignerSeverity = CryptographicHmacsha256WebhookSignerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CryptographicHmacsha256WebhookSignerException';
  }
}

