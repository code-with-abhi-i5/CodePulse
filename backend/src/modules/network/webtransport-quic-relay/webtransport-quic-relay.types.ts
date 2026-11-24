/**
 * @file webtransport-quic-relay.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-QUIC-081]: Global Anycast UDP WebTransport / QUIC Edge Relay Mesh with Sub-5ms Packet Multiplexing.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum WebTransportQuicRelayState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum WebTransportQuicRelaySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum WebTransportQuicRelayErrorCode {
  RECORD_NOT_FOUND = 'WEBTRANSPORTQUICRELAY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'WEBTRANSPORTQUICRELAY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'WEBTRANSPORTQUICRELAY_EMPTY_PAYLOAD',
  INVALID_STATE = 'WEBTRANSPORTQUICRELAY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'WEBTRANSPORTQUICRELAY_CAPACITY_EXCEEDED',
  TIMEOUT = 'WEBTRANSPORTQUICRELAY_TIMEOUT',
  SECURITY_VIOLATION = 'WEBTRANSPORTQUICRELAY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'WEBTRANSPORTQUICRELAY_CHECKSUM_MISMATCH',
}

export interface WebTransportQuicRelayThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface WebTransportQuicRelayConfig {
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
  thresholds: WebTransportQuicRelayThresholds;
}

export interface WebTransportQuicRelayRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: WebTransportQuicRelayState;
  severity: WebTransportQuicRelaySeverity;
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

export interface WebTransportQuicRelayMetricSnapshot {
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

export interface WebTransportQuicRelayFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: WebTransportQuicRelayState;
  severity?: WebTransportQuicRelaySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface WebTransportQuicRelayHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: WebTransportQuicRelayState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface WebTransportQuicRelayAuditEvent {
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

export interface WebTransportQuicRelayBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: WebTransportQuicRelayRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface WebTransportQuicRelaySubscriberCallback {
  (record: WebTransportQuicRelayRecord): void | Promise<void>;
}

export class WebTransportQuicRelayException extends Error {
  constructor(
    public readonly code: WebTransportQuicRelayErrorCode | string,
    message: string,
    public readonly severity: WebTransportQuicRelaySeverity = WebTransportQuicRelaySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'WebTransportQuicRelayException';
  }
}

