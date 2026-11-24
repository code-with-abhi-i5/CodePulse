/**
 * @file zeroknowledge-proof-zksnarks-groth16.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-ZKP-102]: Zero-Knowledge Proof (zk-SNARKs / Groth16) Challenge Verifier Proving Output Without Code Leak.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ZeroknowledgeProofZksnarksGroth16State {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ZeroknowledgeProofZksnarksGroth16Severity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ZeroknowledgeProofZksnarksGroth16ErrorCode {
  RECORD_NOT_FOUND = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_EMPTY_PAYLOAD',
  INVALID_STATE = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_CAPACITY_EXCEEDED',
  TIMEOUT = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_TIMEOUT',
  SECURITY_VIOLATION = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ZEROKNOWLEDGEPROOFZKSNARKSGROTH16_CHECKSUM_MISMATCH',
}

export interface ZeroknowledgeProofZksnarksGroth16Thresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ZeroknowledgeProofZksnarksGroth16Config {
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
  thresholds: ZeroknowledgeProofZksnarksGroth16Thresholds;
}

export interface ZeroknowledgeProofZksnarksGroth16Record {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ZeroknowledgeProofZksnarksGroth16State;
  severity: ZeroknowledgeProofZksnarksGroth16Severity;
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

export interface ZeroknowledgeProofZksnarksGroth16MetricSnapshot {
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

export interface ZeroknowledgeProofZksnarksGroth16FilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ZeroknowledgeProofZksnarksGroth16State;
  severity?: ZeroknowledgeProofZksnarksGroth16Severity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ZeroknowledgeProofZksnarksGroth16HealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ZeroknowledgeProofZksnarksGroth16State;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ZeroknowledgeProofZksnarksGroth16AuditEvent {
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

export interface ZeroknowledgeProofZksnarksGroth16BatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ZeroknowledgeProofZksnarksGroth16Record[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ZeroknowledgeProofZksnarksGroth16SubscriberCallback {
  (record: ZeroknowledgeProofZksnarksGroth16Record): void | Promise<void>;
}

export class ZeroknowledgeProofZksnarksGroth16Exception extends Error {
  constructor(
    public readonly code: ZeroknowledgeProofZksnarksGroth16ErrorCode | string,
    message: string,
    public readonly severity: ZeroknowledgeProofZksnarksGroth16Severity = ZeroknowledgeProofZksnarksGroth16Severity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ZeroknowledgeProofZksnarksGroth16Exception';
  }
}

