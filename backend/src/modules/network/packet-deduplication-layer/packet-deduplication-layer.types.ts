/**
 * @file packet-deduplication-layer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-DEDUPLICATION-098]: Sliding-Window Sequence Ordering & Packet Deduplication Layer for UDP Game Feeds.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PacketDeduplicationLayerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PacketDeduplicationLayerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PacketDeduplicationLayerErrorCode {
  RECORD_NOT_FOUND = 'PACKETDEDUPLICATIONLAYER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'PACKETDEDUPLICATIONLAYER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'PACKETDEDUPLICATIONLAYER_EMPTY_PAYLOAD',
  INVALID_STATE = 'PACKETDEDUPLICATIONLAYER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'PACKETDEDUPLICATIONLAYER_CAPACITY_EXCEEDED',
  TIMEOUT = 'PACKETDEDUPLICATIONLAYER_TIMEOUT',
  SECURITY_VIOLATION = 'PACKETDEDUPLICATIONLAYER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'PACKETDEDUPLICATIONLAYER_CHECKSUM_MISMATCH',
}

export interface PacketDeduplicationLayerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PacketDeduplicationLayerConfig {
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
  thresholds: PacketDeduplicationLayerThresholds;
}

export interface PacketDeduplicationLayerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PacketDeduplicationLayerState;
  severity: PacketDeduplicationLayerSeverity;
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

export interface PacketDeduplicationLayerMetricSnapshot {
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

export interface PacketDeduplicationLayerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PacketDeduplicationLayerState;
  severity?: PacketDeduplicationLayerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PacketDeduplicationLayerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PacketDeduplicationLayerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PacketDeduplicationLayerAuditEvent {
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

export interface PacketDeduplicationLayerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PacketDeduplicationLayerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PacketDeduplicationLayerSubscriberCallback {
  (record: PacketDeduplicationLayerRecord): void | Promise<void>;
}

export class PacketDeduplicationLayerException extends Error {
  constructor(
    public readonly code: PacketDeduplicationLayerErrorCode | string,
    message: string,
    public readonly severity: PacketDeduplicationLayerSeverity = PacketDeduplicationLayerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PacketDeduplicationLayerException';
  }
}

