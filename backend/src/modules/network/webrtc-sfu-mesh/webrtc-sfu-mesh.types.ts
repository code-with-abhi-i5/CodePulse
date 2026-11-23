/**
 * @file webrtc-sfu-mesh.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-SFU-087]: Selective Forwarding Unit (SFU) WebRTC Mesh for Multi-Player Voice Chat & Screen-Sharing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebRtcSfuMeshState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebRtcSfuMeshSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebRtcSfuMeshErrorCode {
  RECORD_NOT_FOUND = 'WEBRTCSFUMESH_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBRTCSFUMESH_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBRTCSFUMESH_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBRTCSFUMESH_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBRTCSFUMESH_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBRTCSFUMESH_TIMEOUT',
  SECURITY_VIOLATION = 'WEBRTCSFUMESH_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBRTCSFUMESH_CHECKSUM_MISMATCH',
}

export interface WebRtcSfuMeshThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebRtcSfuMeshConfig {
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
  thresholds: WebRtcSfuMeshThresholds;
}

export interface WebRtcSfuMeshRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebRtcSfuMeshState;
  severity: WebRtcSfuMeshSeverity;
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

export interface WebRtcSfuMeshMetricSnapshot {
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

export interface WebRtcSfuMeshFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebRtcSfuMeshState;
  severity?: WebRtcSfuMeshSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebRtcSfuMeshHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebRtcSfuMeshState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebRtcSfuMeshAuditEvent {
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

export interface WebRtcSfuMeshBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebRtcSfuMeshRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebRtcSfuMeshSubscriberCallback {
  (record: WebRtcSfuMeshRecord): void | Promise<void>;
}

export class WebRtcSfuMeshException extends Error {
  constructor(
    public readonly code: WebRtcSfuMeshErrorCode | string,
    message: string,
    public readonly severity: WebRtcSfuMeshSeverity = WebRtcSfuMeshSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebRtcSfuMeshException';
  }
}

