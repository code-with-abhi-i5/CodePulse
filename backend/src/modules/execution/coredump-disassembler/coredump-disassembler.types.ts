/**
 * @file coredump-disassembler.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SANDBOX-COREDUMP-048]: Automated Core Dump & Crash Stack Trace Disassembler with DWARF Debug Symbol Extraction.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum CoredumpDisassemblerState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum CoredumpDisassemblerSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum CoredumpDisassemblerErrorCode {
  RECORD_NOT_FOUND = 'COREDUMPDISASSEMBLER_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'COREDUMPDISASSEMBLER_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'COREDUMPDISASSEMBLER_EMPTY_PAYLOAD',
  INVALID_STATE = 'COREDUMPDISASSEMBLER_INVALID_STATE',
  CAPACITY_EXCEEDED = 'COREDUMPDISASSEMBLER_CAPACITY_EXCEEDED',
  TIMEOUT = 'COREDUMPDISASSEMBLER_TIMEOUT',
  SECURITY_VIOLATION = 'COREDUMPDISASSEMBLER_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'COREDUMPDISASSEMBLER_CHECKSUM_MISMATCH',
}

export interface CoredumpDisassemblerThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface CoredumpDisassemblerConfig {
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
  thresholds: CoredumpDisassemblerThresholds;
}

export interface CoredumpDisassemblerRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: CoredumpDisassemblerState;
  severity: CoredumpDisassemblerSeverity;
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

export interface CoredumpDisassemblerMetricSnapshot {
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

export interface CoredumpDisassemblerFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: CoredumpDisassemblerState;
  severity?: CoredumpDisassemblerSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CoredumpDisassemblerHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: CoredumpDisassemblerState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface CoredumpDisassemblerAuditEvent {
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

export interface CoredumpDisassemblerBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: CoredumpDisassemblerRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface CoredumpDisassemblerSubscriberCallback {
  (record: CoredumpDisassemblerRecord): void | Promise<void>;
}

export class CoredumpDisassemblerException extends Error {
  constructor(
    public readonly code: CoredumpDisassemblerErrorCode | string,
    message: string,
    public readonly severity: CoredumpDisassemblerSeverity = CoredumpDisassemblerSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'CoredumpDisassemblerException';
  }
}

