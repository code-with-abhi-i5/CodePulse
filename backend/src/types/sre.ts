/**
 * Site Reliability Engineering & Infrastructure Architecture Types
 */

export interface IdempotencyRecord {
  key: string;
  hash: string;
  status: 'in_flight' | 'completed';
  statusCode?: number;
  responseBody?: unknown;
  createdAt: number;
}

export interface CloudCostAttribution {
  category: string;
  language: string;
  ec2CostUsd: number;
  rdsCostUsd: number;
  totalCostUsd: number;
  submissionCount: number;
  costPerSubmissionUsd: number;
}

export interface ConfigVersion {
  version: number;
  flags: Record<string, boolean | string | number>;
  timestamp: number;
  hash: string;
}

export interface TlsSessionData {
  sessionId: string;
  ticket: string;
  peerIdentity?: string;
  createdAt: number;
  ttlSeconds: number;
}

export interface MultiplexedMessage {
  channel: string;
  event: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface CanaryHealthMetrics {
  errorRatePercent: number;
  p99LatencyMs: number;
  healthyReplicas: number;
}

export interface RollbackDecision {
  shouldRollback: boolean;
  reason?: string;
  targetTag: string;
}

export interface DlqFailureAnalysis {
  jobId: string;
  queueName: string;
  category: 'timeout' | 'memory_limit' | 'syntax_error' | 'rate_limit' | 'unknown';
  rootCause: string;
  retryRecommended: boolean;
}

export interface DnsCacheEntry {
  hostname: string;
  address?: string;
  isNegative: boolean;
  expiresAt: number;
}

export interface ReconnectionSchedule {
  clientId: string;
  delayMs: number;
  attempt: number;
  maxJitterMs: number;
}

export interface EphemeralEnvSpec {
  envId: string;
  prNumber: number;
  branch: string;
  allocatedCpu: string;
  allocatedMemory: string;
  ttlMinutes: number;
  createdAt: number;
  status: 'provisioning' | 'active' | 'expired';
}
