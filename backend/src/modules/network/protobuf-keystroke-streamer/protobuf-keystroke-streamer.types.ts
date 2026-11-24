/**
 * @file protobuf-keystroke-streamer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-PROTOBUF-083]: Binary Protocol Buffer (Protobuf v3) Keystroke Diff Streaming with 75% Bandwidth Reduction.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ProtobufKeystrokeStreamerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ProtobufKeystrokeStreamerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ProtobufKeystrokeStreamerErrorCode {
  RECORD_NOT_FOUND = 'PROTOBUFKEYSTROKESTREAMER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'PROTOBUFKEYSTROKESTREAMER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'PROTOBUFKEYSTROKESTREAMER_EMPTY_PAYLOAD',
  INVALID_STATE = 'PROTOBUFKEYSTROKESTREAMER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'PROTOBUFKEYSTROKESTREAMER_CAPACITY_EXCEEDED',
  TIMEOUT = 'PROTOBUFKEYSTROKESTREAMER_TIMEOUT',
  SECURITY_VIOLATION = 'PROTOBUFKEYSTROKESTREAMER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'PROTOBUFKEYSTROKESTREAMER_CHECKSUM_MISMATCH',
}

export interface ProtobufKeystrokeStreamerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ProtobufKeystrokeStreamerConfig {
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
  thresholds: ProtobufKeystrokeStreamerThresholds;
}

export interface ProtobufKeystrokeStreamerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ProtobufKeystrokeStreamerState;
  severity: ProtobufKeystrokeStreamerSeverity;
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

export interface ProtobufKeystrokeStreamerMetricSnapshot {
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

export interface ProtobufKeystrokeStreamerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ProtobufKeystrokeStreamerState;
  severity?: ProtobufKeystrokeStreamerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProtobufKeystrokeStreamerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ProtobufKeystrokeStreamerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ProtobufKeystrokeStreamerAuditEvent {
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

export interface ProtobufKeystrokeStreamerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ProtobufKeystrokeStreamerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ProtobufKeystrokeStreamerSubscriberCallback {
  (record: ProtobufKeystrokeStreamerRecord): void | Promise<void>;
}

export class ProtobufKeystrokeStreamerException extends Error {
  constructor(
    public readonly code: ProtobufKeystrokeStreamerErrorCode | string,
    message: string,
    public readonly severity: ProtobufKeystrokeStreamerSeverity = ProtobufKeystrokeStreamerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ProtobufKeystrokeStreamerException';
  }
}

