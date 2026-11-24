/**
 * @file anycast-ingress-gateway.types.ts
 * @description Type definitions, telemetry schemas, and enterprise domain contracts for [NET-ANYCAST-094]: BGP Anycast Edge Ingress Gateway with Automatic RTT-Based Client Geolocation.
 * Architecture standard: CodePulse Enterprise Backend - Strict Type Safety & Zero Any Policy.
 */

export enum AnycastIngressGatewayState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  DRAINING = 'DRAINING',
  SUSPENDED = 'SUSPENDED',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum AnycastIngressGatewaySeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL',
}

export enum AnycastIngressGatewayErrorCode {
  RECORD_NOT_FOUND = 'ANYCASTINGRESSGATEWAY_RECORD_NOT_FOUND',
  INVALID_PAYLOAD = 'ANYCASTINGRESSGATEWAY_INVALID_PAYLOAD',
  EMPTY_PAYLOAD = 'ANYCASTINGRESSGATEWAY_EMPTY_PAYLOAD',
  INVALID_STATE = 'ANYCASTINGRESSGATEWAY_INVALID_STATE',
  CAPACITY_EXCEEDED = 'ANYCASTINGRESSGATEWAY_CAPACITY_EXCEEDED',
  TIMEOUT = 'ANYCASTINGRESSGATEWAY_TIMEOUT',
  SECURITY_VIOLATION = 'ANYCASTINGRESSGATEWAY_SECURITY_VIOLATION',
  CHECKSUM_MISMATCH = 'ANYCASTINGRESSGATEWAY_CHECKSUM_MISMATCH',
}

export interface AnycastIngressGatewayThresholds {
  warningUtilizationPct: number;
  criticalUtilizationPct: number;
  maxExecutionTimeMs: number;
  burstAllowanceCount: number;
  autoRecoveryCooloffMs: number;
}

export interface AnycastIngressGatewayConfig {
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
  thresholds: AnycastIngressGatewayThresholds;
}

export interface AnycastIngressGatewayRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  status: AnycastIngressGatewayState;
  severity: AnycastIngressGatewaySeverity;
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

export interface AnycastIngressGatewayMetricSnapshot {
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

export interface AnycastIngressGatewayFilterQuery {
  startDate?: number;
  endDate?: number;
  status?: AnycastIngressGatewayState;
  severity?: AnycastIngressGatewaySeverity;
  tag?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'sequenceNumber' | 'executionDurationMs' | 'memoryDeltaBytes';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AnycastIngressGatewayHealthCheckResult {
  healthy: boolean;
  uptimeSeconds: number;
  lastHeartbeat: number;
  totalErrorsEncountered: number;
  serviceState: AnycastIngressGatewayState;
  subsystemChecks: Record<string, { status: 'UP' | 'DOWN' | 'DEGRADED'; details?: string }>;
}

export interface AnycastIngressGatewayAuditEvent {
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

export interface AnycastIngressGatewayBatchProcessResult {
  totalRequested: number;
  successfulCount: number;
  failedCount: number;
  records: AnycastIngressGatewayRecord[];
  errors: Array<{ index: number; message: string; code: string }>;
  totalDurationMs: number;
}

export interface AnycastIngressGatewaySubscriberCallback {
  (record: AnycastIngressGatewayRecord): void | Promise<void>;
}

export class AnycastIngressGatewayException extends Error {
  constructor(
    public readonly code: AnycastIngressGatewayErrorCode | string,
    message: string,
    public readonly severity: AnycastIngressGatewaySeverity = AnycastIngressGatewaySeverity.HIGH,
    public readonly context?: Record<string, unknown>
  ) {
    super(`[${code}] ${message}`);
    this.name = 'AnycastIngressGatewayException';
  }
}

