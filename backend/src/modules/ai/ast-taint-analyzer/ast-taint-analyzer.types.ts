/**
 * @file ast-taint-analyzer.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-TAINT-079]: AST-Based Inter-Procedural Taint Analysis Engine for Automated Security Vulnerability Detection.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AstTaintAnalyzerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AstTaintAnalyzerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AstTaintAnalyzerErrorCode {
  RECORD_NOT_FOUND = 'ASTTAINTANALYZER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ASTTAINTANALYZER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ASTTAINTANALYZER_EMPTY_PAYLOAD',
  INVALID_STATE = 'ASTTAINTANALYZER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ASTTAINTANALYZER_CAPACITY_EXCEEDED',
  TIMEOUT = 'ASTTAINTANALYZER_TIMEOUT',
  SECURITY_VIOLATION = 'ASTTAINTANALYZER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ASTTAINTANALYZER_CHECKSUM_MISMATCH',
}

export interface AstTaintAnalyzerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AstTaintAnalyzerConfig {
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
  thresholds: AstTaintAnalyzerThresholds;
}

export interface AstTaintAnalyzerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AstTaintAnalyzerState;
  severity: AstTaintAnalyzerSeverity;
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

export interface AstTaintAnalyzerMetricSnapshot {
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

export interface AstTaintAnalyzerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AstTaintAnalyzerState;
  severity?: AstTaintAnalyzerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AstTaintAnalyzerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AstTaintAnalyzerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AstTaintAnalyzerAuditEvent {
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

export interface AstTaintAnalyzerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AstTaintAnalyzerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AstTaintAnalyzerSubscriberCallback {
  (record: AstTaintAnalyzerRecord): void | Promise<void>;
}

export class AstTaintAnalyzerException extends Error {
  constructor(
    public readonly code: AstTaintAnalyzerErrorCode | string,
    message: string,
    public readonly severity: AstTaintAnalyzerSeverity = AstTaintAnalyzerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AstTaintAnalyzerException';
  }
}

