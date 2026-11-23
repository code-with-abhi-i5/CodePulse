/**
 * @file llm-security-firewall.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-FIREWALL-069]: LLM Prompt Injection, Secret Leakage & Jailbreak Defense Firewall.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum LlmSecurityFirewallState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum LlmSecurityFirewallSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum LlmSecurityFirewallErrorCode {
  RECORD_NOT_FOUND = 'LLMSECURITYFIREWALL_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'LLMSECURITYFIREWALL_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'LLMSECURITYFIREWALL_EMPTY_PAYLOAD',
  INVALID_STATE = 'LLMSECURITYFIREWALL_INVALID_STATE',
  CAPACITY_EXCEEDED = 'LLMSECURITYFIREWALL_CAPACITY_EXCEEDED',
  TIMEOUT = 'LLMSECURITYFIREWALL_TIMEOUT',
  SECURITY_VIOLATION = 'LLMSECURITYFIREWALL_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'LLMSECURITYFIREWALL_CHECKSUM_MISMATCH',
}

export interface LlmSecurityFirewallThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface LlmSecurityFirewallConfig {
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
  thresholds: LlmSecurityFirewallThresholds;
}

export interface LlmSecurityFirewallRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: LlmSecurityFirewallState;
  severity: LlmSecurityFirewallSeverity;
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

export interface LlmSecurityFirewallMetricSnapshot {
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

export interface LlmSecurityFirewallFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: LlmSecurityFirewallState;
  severity?: LlmSecurityFirewallSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface LlmSecurityFirewallHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: LlmSecurityFirewallState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface LlmSecurityFirewallAuditEvent {
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

export interface LlmSecurityFirewallBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: LlmSecurityFirewallRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface LlmSecurityFirewallSubscriberCallback {
  (record: LlmSecurityFirewallRecord): void | Promise<void>;
}

export class LlmSecurityFirewallException extends Error {
  constructor(
    public readonly code: LlmSecurityFirewallErrorCode | string,
    message: string,
    public readonly severity: LlmSecurityFirewallSeverity = LlmSecurityFirewallSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'LlmSecurityFirewallException';
  }
}

