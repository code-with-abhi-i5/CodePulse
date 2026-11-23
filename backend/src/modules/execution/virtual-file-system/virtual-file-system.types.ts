/**
 * @file virtual-file-system.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-VFS-056]: In-Memory Virtual File System (VFS) with File-Descriptor Quotas & Path Traversal Guard.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum VirtualFileSystemState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum VirtualFileSystemSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum VirtualFileSystemErrorCode {
  RECORD_NOT_FOUND = 'VIRTUALFILESYSTEM_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'VIRTUALFILESYSTEM_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'VIRTUALFILESYSTEM_EMPTY_PAYLOAD',
  INVALID_STATE = 'VIRTUALFILESYSTEM_INVALID_STATE',
  CAPACITY_EXCEEDED = 'VIRTUALFILESYSTEM_CAPACITY_EXCEEDED',
  TIMEOUT = 'VIRTUALFILESYSTEM_TIMEOUT',
  SECURITY_VIOLATION = 'VIRTUALFILESYSTEM_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'VIRTUALFILESYSTEM_CHECKSUM_MISMATCH',
}

export interface VirtualFileSystemThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface VirtualFileSystemConfig {
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
  thresholds: VirtualFileSystemThresholds;
}

export interface VirtualFileSystemRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: VirtualFileSystemState;
  severity: VirtualFileSystemSeverity;
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

export interface VirtualFileSystemMetricSnapshot {
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

export interface VirtualFileSystemFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: VirtualFileSystemState;
  severity?: VirtualFileSystemSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface VirtualFileSystemHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: VirtualFileSystemState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface VirtualFileSystemAuditEvent {
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

export interface VirtualFileSystemBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: VirtualFileSystemRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface VirtualFileSystemSubscriberCallback {
  (record: VirtualFileSystemRecord): void | Promise<void>;
}

export class VirtualFileSystemException extends Error {
  constructor(
    public readonly code: VirtualFileSystemErrorCode | string,
    message: string,
    public readonly severity: VirtualFileSystemSeverity = VirtualFileSystemSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'VirtualFileSystemException';
  }
}

