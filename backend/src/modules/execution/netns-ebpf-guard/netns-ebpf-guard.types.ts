/**
 * @file netns-ebpf-guard.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-NETNS-049]: Network Namespace Isolation with eBPF Packet Drop for Zero-Network Execution Guarantees.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum NetnsEbpfGuardState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum NetnsEbpfGuardSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum NetnsEbpfGuardErrorCode {
  RECORD_NOT_FOUND = 'NETNSEBPFGUARD_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'NETNSEBPFGUARD_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'NETNSEBPFGUARD_EMPTY_PAYLOAD',
  INVALID_STATE = 'NETNSEBPFGUARD_INVALID_STATE',
  CAPACITY_EXCEEDED = 'NETNSEBPFGUARD_CAPACITY_EXCEEDED',
  TIMEOUT = 'NETNSEBPFGUARD_TIMEOUT',
  SECURITY_VIOLATION = 'NETNSEBPFGUARD_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'NETNSEBPFGUARD_CHECKSUM_MISMATCH',
}

export interface NetnsEbpfGuardThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface NetnsEbpfGuardConfig {
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
  thresholds: NetnsEbpfGuardThresholds;
}

export interface NetnsEbpfGuardRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: NetnsEbpfGuardState;
  severity: NetnsEbpfGuardSeverity;
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

export interface NetnsEbpfGuardMetricSnapshot {
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

export interface NetnsEbpfGuardFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: NetnsEbpfGuardState;
  severity?: NetnsEbpfGuardSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface NetnsEbpfGuardHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: NetnsEbpfGuardState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface NetnsEbpfGuardAuditEvent {
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

export interface NetnsEbpfGuardBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: NetnsEbpfGuardRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface NetnsEbpfGuardSubscriberCallback {
  (record: NetnsEbpfGuardRecord): void | Promise<void>;
}

export class NetnsEbpfGuardException extends Error {
  constructor(
    public readonly code: NetnsEbpfGuardErrorCode | string,
    message: string,
    public readonly severity: NetnsEbpfGuardSeverity = NetnsEbpfGuardSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'NetnsEbpfGuardException';
  }
}

