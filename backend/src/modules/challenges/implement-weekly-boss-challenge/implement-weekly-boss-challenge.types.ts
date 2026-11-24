/**
 * @file implement-weekly-boss-challenge.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [FEAT]: Implement Weekly Boss Challenge Rotator with XP Streak Multipliers in Challenges Worker.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum ImplementWeeklyBossChallengeState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ImplementWeeklyBossChallengeSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum ImplementWeeklyBossChallengeErrorCode {
  RECORD_NOT_FOUND = 'IMPLEMENTWEEKLYBOSSCHALLENGE_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'IMPLEMENTWEEKLYBOSSCHALLENGE_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'IMPLEMENTWEEKLYBOSSCHALLENGE_EMPTY_PAYLOAD',
  INVALID_STATE = 'IMPLEMENTWEEKLYBOSSCHALLENGE_INVALID_STATE',
  CAPACITY_EXCEEDED = 'IMPLEMENTWEEKLYBOSSCHALLENGE_CAPACITY_EXCEEDED',
  TIMEOUT = 'IMPLEMENTWEEKLYBOSSCHALLENGE_TIMEOUT',
  SECURITY_VIOLATION = 'IMPLEMENTWEEKLYBOSSCHALLENGE_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'IMPLEMENTWEEKLYBOSSCHALLENGE_CHECKSUM_MISMATCH',
}

export interface ImplementWeeklyBossChallengeThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface ImplementWeeklyBossChallengeConfig {
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
  thresholds: ImplementWeeklyBossChallengeThresholds;
}

export interface ImplementWeeklyBossChallengeRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: ImplementWeeklyBossChallengeState;
  severity: ImplementWeeklyBossChallengeSeverity;
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

export interface ImplementWeeklyBossChallengeMetricSnapshot {
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

export interface ImplementWeeklyBossChallengeFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: ImplementWeeklyBossChallengeState;
  severity?: ImplementWeeklyBossChallengeSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ImplementWeeklyBossChallengeHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: ImplementWeeklyBossChallengeState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface ImplementWeeklyBossChallengeAuditEvent {
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

export interface ImplementWeeklyBossChallengeBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: ImplementWeeklyBossChallengeRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface ImplementWeeklyBossChallengeSubscriberCallback {
  (record: ImplementWeeklyBossChallengeRecord): void | Promise<void>;
}

export class ImplementWeeklyBossChallengeException extends Error {
  constructor(
    public readonly code: ImplementWeeklyBossChallengeErrorCode | string,
    message: string,
    public readonly severity: ImplementWeeklyBossChallengeSeverity = ImplementWeeklyBossChallengeSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'ImplementWeeklyBossChallengeException';
  }
}

