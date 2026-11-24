/**
 * @file dead-socket-harvester.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-ZOMBIE-095]: Sliding-Window Heartbeat Watchdog & Dead Socket Harvester for WebSocket Fleets.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DeadSocketHarvesterState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DeadSocketHarvesterSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DeadSocketHarvesterErrorCode {
  RECORD_NOT_FOUND = 'DEADSOCKETHARVESTER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DEADSOCKETHARVESTER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DEADSOCKETHARVESTER_EMPTY_PAYLOAD',
  INVALID_STATE = 'DEADSOCKETHARVESTER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DEADSOCKETHARVESTER_CAPACITY_EXCEEDED',
  TIMEOUT = 'DEADSOCKETHARVESTER_TIMEOUT',
  SECURITY_VIOLATION = 'DEADSOCKETHARVESTER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DEADSOCKETHARVESTER_CHECKSUM_MISMATCH',
}

export interface DeadSocketHarvesterThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DeadSocketHarvesterConfig {
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
  thresholds: DeadSocketHarvesterThresholds;
}

export interface DeadSocketHarvesterRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DeadSocketHarvesterState;
  severity: DeadSocketHarvesterSeverity;
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

export interface DeadSocketHarvesterMetricSnapshot {
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

export interface DeadSocketHarvesterFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DeadSocketHarvesterState;
  severity?: DeadSocketHarvesterSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeadSocketHarvesterHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DeadSocketHarvesterState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DeadSocketHarvesterAuditEvent {
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

export interface DeadSocketHarvesterBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DeadSocketHarvesterRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DeadSocketHarvesterSubscriberCallback {
  (record: DeadSocketHarvesterRecord): void | Promise<void>;
}

export class DeadSocketHarvesterException extends Error {
  constructor(
    public readonly code: DeadSocketHarvesterErrorCode | string,
    message: string,
    public readonly severity: DeadSocketHarvesterSeverity = DeadSocketHarvesterSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DeadSocketHarvesterException';
  }
}

