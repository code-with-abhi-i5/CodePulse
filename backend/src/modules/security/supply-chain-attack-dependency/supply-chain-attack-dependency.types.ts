/**
 * @file supply-chain-attack-dependency.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [SEC-TYPOSQUAT-113]: Supply Chain Attack & Dependency Typosquatting Scanner with Shannon Entropy Analyzer.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum SupplyChainAttackDependencyState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum SupplyChainAttackDependencySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum SupplyChainAttackDependencyErrorCode {
  RECORD_NOT_FOUND = 'SUPPLYCHAINATTACKDEPENDENCY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'SUPPLYCHAINATTACKDEPENDENCY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'SUPPLYCHAINATTACKDEPENDENCY_EMPTY_PAYLOAD',
  INVALID_STATE = 'SUPPLYCHAINATTACKDEPENDENCY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'SUPPLYCHAINATTACKDEPENDENCY_CAPACITY_EXCEEDED',
  TIMEOUT = 'SUPPLYCHAINATTACKDEPENDENCY_TIMEOUT',
  SECURITY_VIOLATION = 'SUPPLYCHAINATTACKDEPENDENCY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'SUPPLYCHAINATTACKDEPENDENCY_CHECKSUM_MISMATCH',
}

export interface SupplyChainAttackDependencyThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface SupplyChainAttackDependencyConfig {
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
  thresholds: SupplyChainAttackDependencyThresholds;
}

export interface SupplyChainAttackDependencyRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: SupplyChainAttackDependencyState;
  severity: SupplyChainAttackDependencySeverity;
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

export interface SupplyChainAttackDependencyMetricSnapshot {
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

export interface SupplyChainAttackDependencyFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: SupplyChainAttackDependencyState;
  severity?: SupplyChainAttackDependencySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SupplyChainAttackDependencyHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: SupplyChainAttackDependencyState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface SupplyChainAttackDependencyAuditEvent {
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

export interface SupplyChainAttackDependencyBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: SupplyChainAttackDependencyRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface SupplyChainAttackDependencySubscriberCallback {
  (record: SupplyChainAttackDependencyRecord): void | Promise<void>;
}

export class SupplyChainAttackDependencyException extends Error {
  constructor(
    public readonly code: SupplyChainAttackDependencyErrorCode | string,
    message: string,
    public readonly severity: SupplyChainAttackDependencySeverity = SupplyChainAttackDependencySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'SupplyChainAttackDependencyException';
  }
}

