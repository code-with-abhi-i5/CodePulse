/**
 * @file sandbox-autoscaler.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-AUTOSCALER-052]: Predictive Sandbox Pod Auto-Scaler Integrating Contest Schedule & Queue Growth Rate.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SandboxAutoscalerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SandboxAutoscalerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SandboxAutoscalerErrorCode {
  RECORD_NOT_FOUND = 'SANDBOXAUTOSCALER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SANDBOXAUTOSCALER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SANDBOXAUTOSCALER_EMPTY_PAYLOAD',
  INVALID_STATE = 'SANDBOXAUTOSCALER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SANDBOXAUTOSCALER_CAPACITY_EXCEEDED',
  TIMEOUT = 'SANDBOXAUTOSCALER_TIMEOUT',
  SECURITY_VIOLATION = 'SANDBOXAUTOSCALER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SANDBOXAUTOSCALER_CHECKSUM_MISMATCH',
}

export interface SandboxAutoscalerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SandboxAutoscalerConfig {
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
  thresholds: SandboxAutoscalerThresholds;
}

export interface SandboxAutoscalerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SandboxAutoscalerState;
  severity: SandboxAutoscalerSeverity;
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

export interface SandboxAutoscalerMetricSnapshot {
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

export interface SandboxAutoscalerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SandboxAutoscalerState;
  severity?: SandboxAutoscalerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SandboxAutoscalerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SandboxAutoscalerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SandboxAutoscalerAuditEvent {
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

export interface SandboxAutoscalerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SandboxAutoscalerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SandboxAutoscalerSubscriberCallback {
  (record: SandboxAutoscalerRecord): void | Promise<void>;
}

export class SandboxAutoscalerException extends Error {
  constructor(
    public readonly code: SandboxAutoscalerErrorCode | string,
    message: string,
    public readonly severity: SandboxAutoscalerSeverity = SandboxAutoscalerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SandboxAutoscalerException';
  }
}

