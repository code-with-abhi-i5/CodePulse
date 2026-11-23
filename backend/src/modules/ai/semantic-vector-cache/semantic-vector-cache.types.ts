/**
 * @file semantic-vector-cache.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-CACHE-070]: Semantic Vector Similarity Cache for LLM Code Explanations & Ast Questions.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SemanticVectorCacheState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SemanticVectorCacheSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SemanticVectorCacheErrorCode {
  RECORD_NOT_FOUND = 'SEMANTICVECTORCACHE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SEMANTICVECTORCACHE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SEMANTICVECTORCACHE_EMPTY_PAYLOAD',
  INVALID_STATE = 'SEMANTICVECTORCACHE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SEMANTICVECTORCACHE_CAPACITY_EXCEEDED',
  TIMEOUT = 'SEMANTICVECTORCACHE_TIMEOUT',
  SECURITY_VIOLATION = 'SEMANTICVECTORCACHE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SEMANTICVECTORCACHE_CHECKSUM_MISMATCH',
}

export interface SemanticVectorCacheThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SemanticVectorCacheConfig {
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
  thresholds: SemanticVectorCacheThresholds;
}

export interface SemanticVectorCacheRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SemanticVectorCacheState;
  severity: SemanticVectorCacheSeverity;
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

export interface SemanticVectorCacheMetricSnapshot {
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

export interface SemanticVectorCacheFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SemanticVectorCacheState;
  severity?: SemanticVectorCacheSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SemanticVectorCacheHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SemanticVectorCacheState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SemanticVectorCacheAuditEvent {
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

export interface SemanticVectorCacheBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SemanticVectorCacheRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SemanticVectorCacheSubscriberCallback {
  (record: SemanticVectorCacheRecord): void | Promise<void>;
}

export class SemanticVectorCacheException extends Error {
  constructor(
    public readonly code: SemanticVectorCacheErrorCode | string,
    message: string,
    public readonly severity: SemanticVectorCacheSeverity = SemanticVectorCacheSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SemanticVectorCacheException';
  }
}

