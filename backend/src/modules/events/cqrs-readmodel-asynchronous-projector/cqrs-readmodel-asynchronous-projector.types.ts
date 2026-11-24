/**
 * @file cqrs-readmodel-asynchronous-projector.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [EVENT-CQRS-122]: CQRS Read-Model Asynchronous Projector with Eventual Consistency Self-Healing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CqrsReadmodelAsynchronousProjectorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CqrsReadmodelAsynchronousProjectorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CqrsReadmodelAsynchronousProjectorErrorCode {
  RECORD_NOT_FOUND = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_TIMEOUT',
  SECURITY_VIOLATION = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CQRSREADMODELASYNCHRONOUSPROJECTOR_CHECKSUM_MISMATCH',
}

export interface CqrsReadmodelAsynchronousProjectorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CqrsReadmodelAsynchronousProjectorConfig {
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
  thresholds: CqrsReadmodelAsynchronousProjectorThresholds;
}

export interface CqrsReadmodelAsynchronousProjectorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CqrsReadmodelAsynchronousProjectorState;
  severity: CqrsReadmodelAsynchronousProjectorSeverity;
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

export interface CqrsReadmodelAsynchronousProjectorMetricSnapshot {
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

export interface CqrsReadmodelAsynchronousProjectorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CqrsReadmodelAsynchronousProjectorState;
  severity?: CqrsReadmodelAsynchronousProjectorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CqrsReadmodelAsynchronousProjectorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CqrsReadmodelAsynchronousProjectorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CqrsReadmodelAsynchronousProjectorAuditEvent {
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

export interface CqrsReadmodelAsynchronousProjectorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CqrsReadmodelAsynchronousProjectorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CqrsReadmodelAsynchronousProjectorSubscriberCallback {
  (record: CqrsReadmodelAsynchronousProjectorRecord): void | Promise<void>;
}

export class CqrsReadmodelAsynchronousProjectorException extends Error {
  constructor(
    public readonly code: CqrsReadmodelAsynchronousProjectorErrorCode | string,
    message: string,
    public readonly severity: CqrsReadmodelAsynchronousProjectorSeverity = CqrsReadmodelAsynchronousProjectorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CqrsReadmodelAsynchronousProjectorException';
  }
}

