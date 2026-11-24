/**
 * @file finegrained-attributebased-access-control.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-ABAC-120]: Fine-Grained Attribute-Based Access Control (ABAC) Matrix with Dynamic Contextual Filtering.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum FinegrainedAttributebasedAccessControlState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum FinegrainedAttributebasedAccessControlSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum FinegrainedAttributebasedAccessControlErrorCode {
  RECORD_NOT_FOUND = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_EMPTY_PAYLOAD',
  INVALID_STATE = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_INVALID_STATE',
  CAPACITY_EXCEEDED = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_CAPACITY_EXCEEDED',
  TIMEOUT = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_TIMEOUT',
  SECURITY_VIOLATION = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'FINEGRAINEDATTRIBUTEBASEDACCESSCONTROL_CHECKSUM_MISMATCH',
}

export interface FinegrainedAttributebasedAccessControlThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface FinegrainedAttributebasedAccessControlConfig {
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
  thresholds: FinegrainedAttributebasedAccessControlThresholds;
}

export interface FinegrainedAttributebasedAccessControlRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: FinegrainedAttributebasedAccessControlState;
  severity: FinegrainedAttributebasedAccessControlSeverity;
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

export interface FinegrainedAttributebasedAccessControlMetricSnapshot {
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

export interface FinegrainedAttributebasedAccessControlFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: FinegrainedAttributebasedAccessControlState;
  severity?: FinegrainedAttributebasedAccessControlSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface FinegrainedAttributebasedAccessControlHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: FinegrainedAttributebasedAccessControlState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface FinegrainedAttributebasedAccessControlAuditEvent {
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

export interface FinegrainedAttributebasedAccessControlBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: FinegrainedAttributebasedAccessControlRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface FinegrainedAttributebasedAccessControlSubscriberCallback {
  (record: FinegrainedAttributebasedAccessControlRecord): void | Promise<void>;
}

export class FinegrainedAttributebasedAccessControlException extends Error {
  constructor(
    public readonly code: FinegrainedAttributebasedAccessControlErrorCode | string,
    message: string,
    public readonly severity: FinegrainedAttributebasedAccessControlSeverity = FinegrainedAttributebasedAccessControlSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'FinegrainedAttributebasedAccessControlException';
  }
}

