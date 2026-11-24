/**
 * @file mutation-testing-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-MUTATION-073]: Automated Mutation Testing Engine Measuring Test Quality of AI-Synthesized Tests.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum MutationTestingEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum MutationTestingEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum MutationTestingEngineErrorCode {
  RECORD_NOT_FOUND = 'MUTATIONTESTINGENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'MUTATIONTESTINGENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'MUTATIONTESTINGENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'MUTATIONTESTINGENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'MUTATIONTESTINGENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'MUTATIONTESTINGENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'MUTATIONTESTINGENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'MUTATIONTESTINGENGINE_CHECKSUM_MISMATCH',
}

export interface MutationTestingEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface MutationTestingEngineConfig {
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
  thresholds: MutationTestingEngineThresholds;
}

export interface MutationTestingEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: MutationTestingEngineState;
  severity: MutationTestingEngineSeverity;
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

export interface MutationTestingEngineMetricSnapshot {
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

export interface MutationTestingEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: MutationTestingEngineState;
  severity?: MutationTestingEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface MutationTestingEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: MutationTestingEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface MutationTestingEngineAuditEvent {
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

export interface MutationTestingEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: MutationTestingEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface MutationTestingEngineSubscriberCallback {
  (record: MutationTestingEngineRecord): void | Promise<void>;
}

export class MutationTestingEngineException extends Error {
  constructor(
    public readonly code: MutationTestingEngineErrorCode | string,
    message: string,
    public readonly severity: MutationTestingEngineSeverity = MutationTestingEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'MutationTestingEngineException';
  }
}

