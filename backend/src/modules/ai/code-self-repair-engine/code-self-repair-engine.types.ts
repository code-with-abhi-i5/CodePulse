/**
 * @file code-self-repair-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-REPAIR-075]: Automated Syntactic & Semantic Code Self-Repair Engine with Compiler Feedback Loops.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CodeSelfRepairEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CodeSelfRepairEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CodeSelfRepairEngineErrorCode {
  RECORD_NOT_FOUND = 'CODESELFREPAIRENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CODESELFREPAIRENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CODESELFREPAIRENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'CODESELFREPAIRENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CODESELFREPAIRENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'CODESELFREPAIRENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'CODESELFREPAIRENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CODESELFREPAIRENGINE_CHECKSUM_MISMATCH',
}

export interface CodeSelfRepairEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CodeSelfRepairEngineConfig {
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
  thresholds: CodeSelfRepairEngineThresholds;
}

export interface CodeSelfRepairEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CodeSelfRepairEngineState;
  severity: CodeSelfRepairEngineSeverity;
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

export interface CodeSelfRepairEngineMetricSnapshot {
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

export interface CodeSelfRepairEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CodeSelfRepairEngineState;
  severity?: CodeSelfRepairEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CodeSelfRepairEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CodeSelfRepairEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CodeSelfRepairEngineAuditEvent {
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

export interface CodeSelfRepairEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CodeSelfRepairEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CodeSelfRepairEngineSubscriberCallback {
  (record: CodeSelfRepairEngineRecord): void | Promise<void>;
}

export class CodeSelfRepairEngineException extends Error {
  constructor(
    public readonly code: CodeSelfRepairEngineErrorCode | string,
    message: string,
    public readonly severity: CodeSelfRepairEngineSeverity = CodeSelfRepairEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CodeSelfRepairEngineException';
  }
}

