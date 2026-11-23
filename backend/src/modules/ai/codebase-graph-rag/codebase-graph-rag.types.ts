/**
 * @file codebase-graph-rag.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-GRAPH-RAG-068]: Neo4j Codebase Knowledge Graph RAG with Deep Call-Graph Dependency Traversal.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CodebaseGraphRagState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CodebaseGraphRagSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CodebaseGraphRagErrorCode {
  RECORD_NOT_FOUND = 'CODEBASEGRAPHRAG_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'CODEBASEGRAPHRAG_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'CODEBASEGRAPHRAG_EMPTY_PAYLOAD',
  INVALID_STATE = 'CODEBASEGRAPHRAG_INVALID_STATE',
  CAPACITY_EXCEEDED = 'CODEBASEGRAPHRAG_CAPACITY_EXCEEDED',
  TIMEOUT = 'CODEBASEGRAPHRAG_TIMEOUT',
  SECURITY_VIOLATION = 'CODEBASEGRAPHRAG_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'CODEBASEGRAPHRAG_CHECKSUM_MISMATCH',
}

export interface CodebaseGraphRagThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CodebaseGraphRagConfig {
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
  thresholds: CodebaseGraphRagThresholds;
}

export interface CodebaseGraphRagRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CodebaseGraphRagState;
  severity: CodebaseGraphRagSeverity;
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

export interface CodebaseGraphRagMetricSnapshot {
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

export interface CodebaseGraphRagFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CodebaseGraphRagState;
  severity?: CodebaseGraphRagSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CodebaseGraphRagHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CodebaseGraphRagState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CodebaseGraphRagAuditEvent {
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

export interface CodebaseGraphRagBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CodebaseGraphRagRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CodebaseGraphRagSubscriberCallback {
  (record: CodebaseGraphRagRecord): void | Promise<void>;
}

export class CodebaseGraphRagException extends Error {
  constructor(
    public readonly code: CodebaseGraphRagErrorCode | string,
    message: string,
    public readonly severity: CodebaseGraphRagSeverity = CodebaseGraphRagSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CodebaseGraphRagException';
  }
}

