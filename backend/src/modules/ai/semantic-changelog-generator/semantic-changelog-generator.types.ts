/**
 * @file semantic-changelog-generator.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-CHANGELOG-078]: Semantic Git Commit Clustering & Automated Human-Centric Release Notes Generator.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SemanticChangelogGeneratorState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SemanticChangelogGeneratorSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SemanticChangelogGeneratorErrorCode {
  RECORD_NOT_FOUND = 'SEMANTICCHANGELOGGENERATOR_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SEMANTICCHANGELOGGENERATOR_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SEMANTICCHANGELOGGENERATOR_EMPTY_PAYLOAD',
  INVALID_STATE = 'SEMANTICCHANGELOGGENERATOR_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SEMANTICCHANGELOGGENERATOR_CAPACITY_EXCEEDED',
  TIMEOUT = 'SEMANTICCHANGELOGGENERATOR_TIMEOUT',
  SECURITY_VIOLATION = 'SEMANTICCHANGELOGGENERATOR_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SEMANTICCHANGELOGGENERATOR_CHECKSUM_MISMATCH',
}

export interface SemanticChangelogGeneratorThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SemanticChangelogGeneratorConfig {
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
  thresholds: SemanticChangelogGeneratorThresholds;
}

export interface SemanticChangelogGeneratorRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SemanticChangelogGeneratorState;
  severity: SemanticChangelogGeneratorSeverity;
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

export interface SemanticChangelogGeneratorMetricSnapshot {
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

export interface SemanticChangelogGeneratorFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SemanticChangelogGeneratorState;
  severity?: SemanticChangelogGeneratorSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SemanticChangelogGeneratorHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SemanticChangelogGeneratorState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SemanticChangelogGeneratorAuditEvent {
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

export interface SemanticChangelogGeneratorBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SemanticChangelogGeneratorRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SemanticChangelogGeneratorSubscriberCallback {
  (record: SemanticChangelogGeneratorRecord): void | Promise<void>;
}

export class SemanticChangelogGeneratorException extends Error {
  constructor(
    public readonly code: SemanticChangelogGeneratorErrorCode | string,
    message: string,
    public readonly severity: SemanticChangelogGeneratorSeverity = SemanticChangelogGeneratorSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SemanticChangelogGeneratorException';
  }
}

