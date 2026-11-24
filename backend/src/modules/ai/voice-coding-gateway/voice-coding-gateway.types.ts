/**
 * @file voice-coding-gateway.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-VOICE-080]: Real-Time Full-Duplex Voice Coding Assistant Gateway with WebRTC & Audio Turn-Detection.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum VoiceCodingGatewayState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum VoiceCodingGatewaySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum VoiceCodingGatewayErrorCode {
  RECORD_NOT_FOUND = 'VOICECODINGGATEWAY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'VOICECODINGGATEWAY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'VOICECODINGGATEWAY_EMPTY_PAYLOAD',
  INVALID_STATE = 'VOICECODINGGATEWAY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'VOICECODINGGATEWAY_CAPACITY_EXCEEDED',
  TIMEOUT = 'VOICECODINGGATEWAY_TIMEOUT',
  SECURITY_VIOLATION = 'VOICECODINGGATEWAY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'VOICECODINGGATEWAY_CHECKSUM_MISMATCH',
}

export interface VoiceCodingGatewayThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface VoiceCodingGatewayConfig {
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
  thresholds: VoiceCodingGatewayThresholds;
}

export interface VoiceCodingGatewayRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: VoiceCodingGatewayState;
  severity: VoiceCodingGatewaySeverity;
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

export interface VoiceCodingGatewayMetricSnapshot {
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

export interface VoiceCodingGatewayFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: VoiceCodingGatewayState;
  severity?: VoiceCodingGatewaySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface VoiceCodingGatewayHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: VoiceCodingGatewayState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface VoiceCodingGatewayAuditEvent {
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

export interface VoiceCodingGatewayBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: VoiceCodingGatewayRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface VoiceCodingGatewaySubscriberCallback {
  (record: VoiceCodingGatewayRecord): void | Promise<void>;
}

export class VoiceCodingGatewayException extends Error {
  constructor(
    public readonly code: VoiceCodingGatewayErrorCode | string,
    message: string,
    public readonly severity: VoiceCodingGatewaySeverity = VoiceCodingGatewaySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'VoiceCodingGatewayException';
  }
}

