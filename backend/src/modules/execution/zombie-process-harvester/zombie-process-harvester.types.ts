/**
 * @file zombie-process-harvester.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-CLEANUP-059]: Zombie Process Harvester & Subreaper Daemon with Zero Orphaned File Descriptor Leakage.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ZombieProcessHarvesterState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ZombieProcessHarvesterSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ZombieProcessHarvesterErrorCode {
  RECORD_NOT_FOUND = 'ZOMBIEPROCESSHARVESTER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ZOMBIEPROCESSHARVESTER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ZOMBIEPROCESSHARVESTER_EMPTY_PAYLOAD',
  INVALID_STATE = 'ZOMBIEPROCESSHARVESTER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ZOMBIEPROCESSHARVESTER_CAPACITY_EXCEEDED',
  TIMEOUT = 'ZOMBIEPROCESSHARVESTER_TIMEOUT',
  SECURITY_VIOLATION = 'ZOMBIEPROCESSHARVESTER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ZOMBIEPROCESSHARVESTER_CHECKSUM_MISMATCH',
}

export interface ZombieProcessHarvesterThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ZombieProcessHarvesterConfig {
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
  thresholds: ZombieProcessHarvesterThresholds;
}

export interface ZombieProcessHarvesterRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ZombieProcessHarvesterState;
  severity: ZombieProcessHarvesterSeverity;
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

export interface ZombieProcessHarvesterMetricSnapshot {
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

export interface ZombieProcessHarvesterFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ZombieProcessHarvesterState;
  severity?: ZombieProcessHarvesterSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ZombieProcessHarvesterHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ZombieProcessHarvesterState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ZombieProcessHarvesterAuditEvent {
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

export interface ZombieProcessHarvesterBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ZombieProcessHarvesterRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ZombieProcessHarvesterSubscriberCallback {
  (record: ZombieProcessHarvesterRecord): void | Promise<void>;
}

export class ZombieProcessHarvesterException extends Error {
  constructor(
    public readonly code: ZombieProcessHarvesterErrorCode | string,
    message: string,
    public readonly severity: ZombieProcessHarvesterSeverity = ZombieProcessHarvesterSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ZombieProcessHarvesterException';
  }
}

