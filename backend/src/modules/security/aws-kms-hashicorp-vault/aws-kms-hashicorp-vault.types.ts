/**
 * @file aws-kms-hashicorp-vault.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-ENVELOPE-108]: AWS KMS / HashiCorp Vault Envelope Encryption Engine for Per-Tenant Data Isolation.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AwsKmsHashicorpVaultState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AwsKmsHashicorpVaultSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AwsKmsHashicorpVaultErrorCode {
  RECORD_NOT_FOUND = 'AWSKMSHASHICORPVAULT_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'AWSKMSHASHICORPVAULT_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'AWSKMSHASHICORPVAULT_EMPTY_PAYLOAD',
  INVALID_STATE = 'AWSKMSHASHICORPVAULT_INVALID_STATE',
  CAPACITY_EXCEEDED = 'AWSKMSHASHICORPVAULT_CAPACITY_EXCEEDED',
  TIMEOUT = 'AWSKMSHASHICORPVAULT_TIMEOUT',
  SECURITY_VIOLATION = 'AWSKMSHASHICORPVAULT_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'AWSKMSHASHICORPVAULT_CHECKSUM_MISMATCH',
}

export interface AwsKmsHashicorpVaultThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AwsKmsHashicorpVaultConfig {
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
  thresholds: AwsKmsHashicorpVaultThresholds;
}

export interface AwsKmsHashicorpVaultRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AwsKmsHashicorpVaultState;
  severity: AwsKmsHashicorpVaultSeverity;
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

export interface AwsKmsHashicorpVaultMetricSnapshot {
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

export interface AwsKmsHashicorpVaultFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AwsKmsHashicorpVaultState;
  severity?: AwsKmsHashicorpVaultSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AwsKmsHashicorpVaultHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AwsKmsHashicorpVaultState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AwsKmsHashicorpVaultAuditEvent {
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

export interface AwsKmsHashicorpVaultBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AwsKmsHashicorpVaultRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AwsKmsHashicorpVaultSubscriberCallback {
  (record: AwsKmsHashicorpVaultRecord): void | Promise<void>;
}

export class AwsKmsHashicorpVaultException extends Error {
  constructor(
    public readonly code: AwsKmsHashicorpVaultErrorCode | string,
    message: string,
    public readonly severity: AwsKmsHashicorpVaultSeverity = AwsKmsHashicorpVaultSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AwsKmsHashicorpVaultException';
  }
}

