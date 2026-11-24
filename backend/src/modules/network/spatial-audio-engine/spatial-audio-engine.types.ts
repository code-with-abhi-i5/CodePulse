/**
 * @file spatial-audio-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-SPATIAL-AUDIO-099]: 3D Spatial Audio Coordinate Panner & Distance Attenuation Engine for Virtual Hackathons.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SpatialAudioEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SpatialAudioEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SpatialAudioEngineErrorCode {
  RECORD_NOT_FOUND = 'SPATIALAUDIOENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SPATIALAUDIOENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SPATIALAUDIOENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'SPATIALAUDIOENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SPATIALAUDIOENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'SPATIALAUDIOENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'SPATIALAUDIOENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SPATIALAUDIOENGINE_CHECKSUM_MISMATCH',
}

export interface SpatialAudioEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SpatialAudioEngineConfig {
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
  thresholds: SpatialAudioEngineThresholds;
}

export interface SpatialAudioEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SpatialAudioEngineState;
  severity: SpatialAudioEngineSeverity;
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

export interface SpatialAudioEngineMetricSnapshot {
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

export interface SpatialAudioEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SpatialAudioEngineState;
  severity?: SpatialAudioEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SpatialAudioEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SpatialAudioEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SpatialAudioEngineAuditEvent {
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

export interface SpatialAudioEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SpatialAudioEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SpatialAudioEngineSubscriberCallback {
  (record: SpatialAudioEngineRecord): void | Promise<void>;
}

export class SpatialAudioEngineException extends Error {
  constructor(
    public readonly code: SpatialAudioEngineErrorCode | string,
    message: string,
    public readonly severity: SpatialAudioEngineSeverity = SpatialAudioEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SpatialAudioEngineException';
  }
}

