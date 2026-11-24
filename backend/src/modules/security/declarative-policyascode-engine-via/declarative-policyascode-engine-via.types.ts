/**
 * @file declarative-policyascode-engine-via.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-OPA-104]: Declarative Policy-as-Code Engine via Open Policy Agent (OPA) / Rego for Enterprise RBAC.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum DeclarativePolicyascodeEngineViaState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum DeclarativePolicyascodeEngineViaSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum DeclarativePolicyascodeEngineViaErrorCode {
  RECORD_NOT_FOUND = 'DECLARATIVEPOLICYASCODEENGINEVIA_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'DECLARATIVEPOLICYASCODEENGINEVIA_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'DECLARATIVEPOLICYASCODEENGINEVIA_EMPTY_PAYLOAD',
  INVALID_STATE = 'DECLARATIVEPOLICYASCODEENGINEVIA_INVALID_STATE',
  CAPACITY_EXCEEDED = 'DECLARATIVEPOLICYASCODEENGINEVIA_CAPACITY_EXCEEDED',
  TIMEOUT = 'DECLARATIVEPOLICYASCODEENGINEVIA_TIMEOUT',
  SECURITY_VIOLATION = 'DECLARATIVEPOLICYASCODEENGINEVIA_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'DECLARATIVEPOLICYASCODEENGINEVIA_CHECKSUM_MISMATCH',
}

export interface DeclarativePolicyascodeEngineViaThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface DeclarativePolicyascodeEngineViaConfig {
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
  thresholds: DeclarativePolicyascodeEngineViaThresholds;
}

export interface DeclarativePolicyascodeEngineViaRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: DeclarativePolicyascodeEngineViaState;
  severity: DeclarativePolicyascodeEngineViaSeverity;
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

export interface DeclarativePolicyascodeEngineViaMetricSnapshot {
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

export interface DeclarativePolicyascodeEngineViaFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: DeclarativePolicyascodeEngineViaState;
  severity?: DeclarativePolicyascodeEngineViaSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface DeclarativePolicyascodeEngineViaHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: DeclarativePolicyascodeEngineViaState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface DeclarativePolicyascodeEngineViaAuditEvent {
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

export interface DeclarativePolicyascodeEngineViaBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: DeclarativePolicyascodeEngineViaRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface DeclarativePolicyascodeEngineViaSubscriberCallback {
  (record: DeclarativePolicyascodeEngineViaRecord): void | Promise<void>;
}

export class DeclarativePolicyascodeEngineViaException extends Error {
  constructor(
    public readonly code: DeclarativePolicyascodeEngineViaErrorCode | string,
    message: string,
    public readonly severity: DeclarativePolicyascodeEngineViaSeverity = DeclarativePolicyascodeEngineViaSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'DeclarativePolicyascodeEngineViaException';
  }
}

