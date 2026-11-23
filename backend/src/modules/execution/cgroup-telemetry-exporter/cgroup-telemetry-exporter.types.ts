/**
 * @file cgroup-telemetry-exporter.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-METRICS-058]: High-Frequency Cgroup v2 Telemetry Exporter for Real-Time Execution Resource Graphing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CgroupTelemetryExporterState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CgroupTelemetryExporterSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CgroupTelemetryExporterErrorCode {
  RECORD_NOT_FOUND = 'CGROUPTELEMETRYEXPORTER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CGROUPTELEMETRYEXPORTER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CGROUPTELEMETRYEXPORTER_EMPTY_PAYLOAD',
  INVALID_STATE = 'CGROUPTELEMETRYEXPORTER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CGROUPTELEMETRYEXPORTER_CAPACITY_EXCEEDED',
  TIMEOUT = 'CGROUPTELEMETRYEXPORTER_TIMEOUT',
  SECURITY_VIOLATION = 'CGROUPTELEMETRYEXPORTER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CGROUPTELEMETRYEXPORTER_CHECKSUM_MISMATCH',
}

export interface CgroupTelemetryExporterThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CgroupTelemetryExporterConfig {
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
  thresholds: CgroupTelemetryExporterThresholds;
}

export interface CgroupTelemetryExporterRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CgroupTelemetryExporterState;
  severity: CgroupTelemetryExporterSeverity;
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

export interface CgroupTelemetryExporterMetricSnapshot {
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

export interface CgroupTelemetryExporterFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CgroupTelemetryExporterState;
  severity?: CgroupTelemetryExporterSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CgroupTelemetryExporterHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CgroupTelemetryExporterState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CgroupTelemetryExporterAuditEvent {
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

export interface CgroupTelemetryExporterBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CgroupTelemetryExporterRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CgroupTelemetryExporterSubscriberCallback {
  (record: CgroupTelemetryExporterRecord): void | Promise<void>;
}

export class CgroupTelemetryExporterException extends Error {
  constructor(
    public readonly code: CgroupTelemetryExporterErrorCode | string,
    message: string,
    public readonly severity: CgroupTelemetryExporterSeverity = CgroupTelemetryExporterSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CgroupTelemetryExporterException';
  }
}

