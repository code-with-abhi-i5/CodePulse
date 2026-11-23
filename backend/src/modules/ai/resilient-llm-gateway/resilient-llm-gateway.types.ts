/**
 * @file resilient-llm-gateway.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-GATEWAY-071]: Multi-Model Resilient LLM Gateway with Latency-Based Dynamic Routing & Auto-Failover.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ResilientLlmGatewayState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ResilientLlmGatewaySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ResilientLlmGatewayErrorCode {
  RECORD_NOT_FOUND = 'RESILIENTLLMGATEWAY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'RESILIENTLLMGATEWAY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'RESILIENTLLMGATEWAY_EMPTY_PAYLOAD',
  INVALID_STATE = 'RESILIENTLLMGATEWAY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'RESILIENTLLMGATEWAY_CAPACITY_EXCEEDED',
  TIMEOUT = 'RESILIENTLLMGATEWAY_TIMEOUT',
  SECURITY_VIOLATION = 'RESILIENTLLMGATEWAY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'RESILIENTLLMGATEWAY_CHECKSUM_MISMATCH',
}

export interface ResilientLlmGatewayThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ResilientLlmGatewayConfig {
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
  thresholds: ResilientLlmGatewayThresholds;
}

export interface ResilientLlmGatewayRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ResilientLlmGatewayState;
  severity: ResilientLlmGatewaySeverity;
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

export interface ResilientLlmGatewayMetricSnapshot {
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

export interface ResilientLlmGatewayFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ResilientLlmGatewayState;
  severity?: ResilientLlmGatewaySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ResilientLlmGatewayHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ResilientLlmGatewayState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ResilientLlmGatewayAuditEvent {
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

export interface ResilientLlmGatewayBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ResilientLlmGatewayRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ResilientLlmGatewaySubscriberCallback {
  (record: ResilientLlmGatewayRecord): void | Promise<void>;
}

export class ResilientLlmGatewayException extends Error {
  constructor(
    public readonly code: ResilientLlmGatewayErrorCode | string,
    message: string,
    public readonly severity: ResilientLlmGatewaySeverity = ResilientLlmGatewaySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ResilientLlmGatewayException';
  }
}

