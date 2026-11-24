/**
 * @file automated-righttobeforgotten-cryptographic-user.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-GDPR-105]: Automated Right-to-be-Forgotten Cryptographic User Shredding Pipeline with Verifiable PDF Certificates.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AutomatedRighttobeforgottenCryptographicUserState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AutomatedRighttobeforgottenCryptographicUserSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AutomatedRighttobeforgottenCryptographicUserErrorCode {
  RECORD_NOT_FOUND = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_EMPTY_PAYLOAD',
  INVALID_STATE = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_CAPACITY_EXCEEDED',
  TIMEOUT = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_TIMEOUT',
  SECURITY_VIOLATION = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'AUTOMATEDRIGHTTOBEFORGOTTENCRYPTOGRAPHICUSER_CHECKSUM_MISMATCH',
}

export interface AutomatedRighttobeforgottenCryptographicUserThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AutomatedRighttobeforgottenCryptographicUserConfig {
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
  thresholds: AutomatedRighttobeforgottenCryptographicUserThresholds;
}

export interface AutomatedRighttobeforgottenCryptographicUserRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AutomatedRighttobeforgottenCryptographicUserState;
  severity: AutomatedRighttobeforgottenCryptographicUserSeverity;
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

export interface AutomatedRighttobeforgottenCryptographicUserMetricSnapshot {
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

export interface AutomatedRighttobeforgottenCryptographicUserFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AutomatedRighttobeforgottenCryptographicUserState;
  severity?: AutomatedRighttobeforgottenCryptographicUserSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AutomatedRighttobeforgottenCryptographicUserHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AutomatedRighttobeforgottenCryptographicUserState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AutomatedRighttobeforgottenCryptographicUserAuditEvent {
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

export interface AutomatedRighttobeforgottenCryptographicUserBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AutomatedRighttobeforgottenCryptographicUserRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AutomatedRighttobeforgottenCryptographicUserSubscriberCallback {
  (record: AutomatedRighttobeforgottenCryptographicUserRecord): void | Promise<void>;
}

export class AutomatedRighttobeforgottenCryptographicUserException extends Error {
  constructor(
    public readonly code: AutomatedRighttobeforgottenCryptographicUserErrorCode | string,
    message: string,
    public readonly severity: AutomatedRighttobeforgottenCryptographicUserSeverity = AutomatedRighttobeforgottenCryptographicUserSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AutomatedRighttobeforgottenCryptographicUserException';
  }
}

