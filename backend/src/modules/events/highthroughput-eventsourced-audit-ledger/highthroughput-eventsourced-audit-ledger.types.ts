/**
 * @file highthroughput-eventsourced-audit-ledger.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [EVENT-KAFKA-121]: High-Throughput Event-Sourced Audit Ledger with Redpanda / Apache Kafka Storage.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum HighthroughputEventsourcedAuditLedgerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum HighthroughputEventsourcedAuditLedgerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum HighthroughputEventsourcedAuditLedgerErrorCode {
  RECORD_NOT_FOUND = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_EMPTY_PAYLOAD',
  INVALID_STATE = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_CAPACITY_EXCEEDED',
  TIMEOUT = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_TIMEOUT',
  SECURITY_VIOLATION = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'HIGHTHROUGHPUTEVENTSOURCEDAUDITLEDGER_CHECKSUM_MISMATCH',
}

export interface HighthroughputEventsourcedAuditLedgerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface HighthroughputEventsourcedAuditLedgerConfig {
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
  thresholds: HighthroughputEventsourcedAuditLedgerThresholds;
}

export interface HighthroughputEventsourcedAuditLedgerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: HighthroughputEventsourcedAuditLedgerState;
  severity: HighthroughputEventsourcedAuditLedgerSeverity;
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

export interface HighthroughputEventsourcedAuditLedgerMetricSnapshot {
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

export interface HighthroughputEventsourcedAuditLedgerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: HighthroughputEventsourcedAuditLedgerState;
  severity?: HighthroughputEventsourcedAuditLedgerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface HighthroughputEventsourcedAuditLedgerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: HighthroughputEventsourcedAuditLedgerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface HighthroughputEventsourcedAuditLedgerAuditEvent {
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

export interface HighthroughputEventsourcedAuditLedgerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: HighthroughputEventsourcedAuditLedgerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface HighthroughputEventsourcedAuditLedgerSubscriberCallback {
  (record: HighthroughputEventsourcedAuditLedgerRecord): void | Promise<void>;
}

export class HighthroughputEventsourcedAuditLedgerException extends Error {
  constructor(
    public readonly code: HighthroughputEventsourcedAuditLedgerErrorCode | string,
    message: string,
    public readonly severity: HighthroughputEventsourcedAuditLedgerSeverity = HighthroughputEventsourcedAuditLedgerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'HighthroughputEventsourcedAuditLedgerException';
  }
}

