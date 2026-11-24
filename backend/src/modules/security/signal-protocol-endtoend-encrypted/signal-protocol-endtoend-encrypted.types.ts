/**
 * @file signal-protocol-endtoend-encrypted.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-DOUBLE-RATCHET-111]: Signal Protocol End-to-End Encrypted (E2EE) Team Messaging with Double Ratchet Algorithm.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SignalProtocolEndtoendEncryptedState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SignalProtocolEndtoendEncryptedSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SignalProtocolEndtoendEncryptedErrorCode {
  RECORD_NOT_FOUND = 'SIGNALPROTOCOLENDTOENDENCRYPTED_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SIGNALPROTOCOLENDTOENDENCRYPTED_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SIGNALPROTOCOLENDTOENDENCRYPTED_EMPTY_PAYLOAD',
  INVALID_STATE = 'SIGNALPROTOCOLENDTOENDENCRYPTED_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SIGNALPROTOCOLENDTOENDENCRYPTED_CAPACITY_EXCEEDED',
  TIMEOUT = 'SIGNALPROTOCOLENDTOENDENCRYPTED_TIMEOUT',
  SECURITY_VIOLATION = 'SIGNALPROTOCOLENDTOENDENCRYPTED_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SIGNALPROTOCOLENDTOENDENCRYPTED_CHECKSUM_MISMATCH',
}

export interface SignalProtocolEndtoendEncryptedThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SignalProtocolEndtoendEncryptedConfig {
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
  thresholds: SignalProtocolEndtoendEncryptedThresholds;
}

export interface SignalProtocolEndtoendEncryptedRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SignalProtocolEndtoendEncryptedState;
  severity: SignalProtocolEndtoendEncryptedSeverity;
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

export interface SignalProtocolEndtoendEncryptedMetricSnapshot {
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

export interface SignalProtocolEndtoendEncryptedFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SignalProtocolEndtoendEncryptedState;
  severity?: SignalProtocolEndtoendEncryptedSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SignalProtocolEndtoendEncryptedHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SignalProtocolEndtoendEncryptedState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SignalProtocolEndtoendEncryptedAuditEvent {
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

export interface SignalProtocolEndtoendEncryptedBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SignalProtocolEndtoendEncryptedRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SignalProtocolEndtoendEncryptedSubscriberCallback {
  (record: SignalProtocolEndtoendEncryptedRecord): void | Promise<void>;
}

export class SignalProtocolEndtoendEncryptedException extends Error {
  constructor(
    public readonly code: SignalProtocolEndtoendEncryptedErrorCode | string,
    message: string,
    public readonly severity: SignalProtocolEndtoendEncryptedSeverity = SignalProtocolEndtoendEncryptedSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SignalProtocolEndtoendEncryptedException';
  }
}

