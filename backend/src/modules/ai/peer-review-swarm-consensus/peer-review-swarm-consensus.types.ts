/**
 * @file peer-review-swarm-consensus.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [AI-SWARM-063]: Autonomous Multi-Agent Peer Review Swarm with Verifier-Debater Consensus Protocol.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum PeerReviewSwarmConsensusState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum PeerReviewSwarmConsensusSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum PeerReviewSwarmConsensusErrorCode {
  RECORD_NOT_FOUND = 'PEERREVIEWSWARMCONSENSUS_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'PEERREVIEWSWARMCONSENSUS_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'PEERREVIEWSWARMCONSENSUS_EMPTY_PAYLOAD',
  INVALID_STATE = 'PEERREVIEWSWARMCONSENSUS_INVALID_STATE',
  CAPACITY_EXCEEDED = 'PEERREVIEWSWARMCONSENSUS_CAPACITY_EXCEEDED',
  TIMEOUT = 'PEERREVIEWSWARMCONSENSUS_TIMEOUT',
  SECURITY_VIOLATION = 'PEERREVIEWSWARMCONSENSUS_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'PEERREVIEWSWARMCONSENSUS_CHECKSUM_MISMATCH',
}

export interface PeerReviewSwarmConsensusThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface PeerReviewSwarmConsensusConfig {
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
  thresholds: PeerReviewSwarmConsensusThresholds;
}

export interface PeerReviewSwarmConsensusRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: PeerReviewSwarmConsensusState;
  severity: PeerReviewSwarmConsensusSeverity;
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

export interface PeerReviewSwarmConsensusMetricSnapshot {
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

export interface PeerReviewSwarmConsensusFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: PeerReviewSwarmConsensusState;
  severity?: PeerReviewSwarmConsensusSeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PeerReviewSwarmConsensusHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: PeerReviewSwarmConsensusState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface PeerReviewSwarmConsensusAuditEvent {
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

export interface PeerReviewSwarmConsensusBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: PeerReviewSwarmConsensusRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface PeerReviewSwarmConsensusSubscriberCallback {
  (record: PeerReviewSwarmConsensusRecord): void | Promise<void>;
}

export class PeerReviewSwarmConsensusException extends Error {
  constructor(
    public readonly code: PeerReviewSwarmConsensusErrorCode | string,
    message: string,
    public readonly severity: PeerReviewSwarmConsensusSeverity = PeerReviewSwarmConsensusSeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PeerReviewSwarmConsensusException';
  }
}

