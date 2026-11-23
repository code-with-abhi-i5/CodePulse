/**
 * @file ast-semantic-embedding-engine.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-RAG-061]: Hierarchical AST Multi-Vector Semantic Code Embedding & Hybrid Dense-Sparse Search Engine.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AstSemanticEmbeddingEngineState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AstSemanticEmbeddingEngineSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AstSemanticEmbeddingEngineErrorCode {
  RECORD_NOT_FOUND = 'ASTSEMANTICEMBEDDINGENGINE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ASTSEMANTICEMBEDDINGENGINE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ASTSEMANTICEMBEDDINGENGINE_EMPTY_PAYLOAD',
  INVALID_STATE = 'ASTSEMANTICEMBEDDINGENGINE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ASTSEMANTICEMBEDDINGENGINE_CAPACITY_EXCEEDED',
  TIMEOUT = 'ASTSEMANTICEMBEDDINGENGINE_TIMEOUT',
  SECURITY_VIOLATION = 'ASTSEMANTICEMBEDDINGENGINE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ASTSEMANTICEMBEDDINGENGINE_CHECKSUM_MISMATCH',
}

export interface AstSemanticEmbeddingEngineThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AstSemanticEmbeddingEngineConfig {
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
  thresholds: AstSemanticEmbeddingEngineThresholds;
}

export interface AstSemanticEmbeddingEngineRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AstSemanticEmbeddingEngineState;
  severity: AstSemanticEmbeddingEngineSeverity;
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

export interface AstSemanticEmbeddingEngineMetricSnapshot {
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

export interface AstSemanticEmbeddingEngineFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AstSemanticEmbeddingEngineState;
  severity?: AstSemanticEmbeddingEngineSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AstSemanticEmbeddingEngineHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AstSemanticEmbeddingEngineState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AstSemanticEmbeddingEngineAuditEvent {
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

export interface AstSemanticEmbeddingEngineBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AstSemanticEmbeddingEngineRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AstSemanticEmbeddingEngineSubscriberCallback {
  (record: AstSemanticEmbeddingEngineRecord): void | Promise<void>;
}

export class AstSemanticEmbeddingEngineException extends Error {
  constructor(
    public readonly code: AstSemanticEmbeddingEngineErrorCode | string,
    message: string,
    public readonly severity: AstSemanticEmbeddingEngineSeverity = AstSemanticEmbeddingEngineSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AstSemanticEmbeddingEngineException';
  }
}

