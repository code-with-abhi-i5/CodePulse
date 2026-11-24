/**
 * @file postquantum-hybrid-cryptographic-handshake.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-PQ-101]: Post-Quantum Hybrid Cryptographic Handshake Engine (CRYSTALS-Kyber-768 & Dilithium).
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PostquantumHybridCryptographicHandshakeState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PostquantumHybridCryptographicHandshakeSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PostquantumHybridCryptographicHandshakeErrorCode {
  RECORD_NOT_FOUND = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_EMPTY_PAYLOAD',
  INVALID_STATE = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_CAPACITY_EXCEEDED',
  TIMEOUT = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_TIMEOUT',
  SECURITY_VIOLATION = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'POSTQUANTUMHYBRIDCRYPTOGRAPHICHANDSHAKE_CHECKSUM_MISMATCH',
}

export interface PostquantumHybridCryptographicHandshakeThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PostquantumHybridCryptographicHandshakeConfig {
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
  thresholds: PostquantumHybridCryptographicHandshakeThresholds;
}

export interface PostquantumHybridCryptographicHandshakeRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PostquantumHybridCryptographicHandshakeState;
  severity: PostquantumHybridCryptographicHandshakeSeverity;
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

export interface PostquantumHybridCryptographicHandshakeMetricSnapshot {
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

export interface PostquantumHybridCryptographicHandshakeFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PostquantumHybridCryptographicHandshakeState;
  severity?: PostquantumHybridCryptographicHandshakeSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PostquantumHybridCryptographicHandshakeHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PostquantumHybridCryptographicHandshakeState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PostquantumHybridCryptographicHandshakeAuditEvent {
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

export interface PostquantumHybridCryptographicHandshakeBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PostquantumHybridCryptographicHandshakeRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PostquantumHybridCryptographicHandshakeSubscriberCallback {
  (record: PostquantumHybridCryptographicHandshakeRecord): void | Promise<void>;
}

export class PostquantumHybridCryptographicHandshakeException extends Error {
  constructor(
    public readonly code: PostquantumHybridCryptographicHandshakeErrorCode | string,
    message: string,
    public readonly severity: PostquantumHybridCryptographicHandshakeSeverity = PostquantumHybridCryptographicHandshakeSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PostquantumHybridCryptographicHandshakeException';
  }
}

