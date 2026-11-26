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

// --- Batch 4 SRE Types ---
export interface SyntheticStepResult {
  stepName: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface SyntheticProbeResult {
  probeId: string;
  targetRegion: string;
  totalDurationMs: number;
  success: boolean;
  steps: SyntheticStepResult[];
  timestamp: number;
}

export interface RegionHealthStatus {
  regionId: string;
  healthy: boolean;
  consecutiveFailures: number;
  lastHeartbeat: number;
}

export interface FailoverDecision {
  primaryRegion: string;
  activeRegion: string;
  failoverTriggered: boolean;
  dnsWeightPrimary: number;
  dnsWeightSecondary: number;
  reason: string;
}

export interface StackFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  hitCount: number;
}

export interface FlamegraphNode {
  name: string;
  value: number;
  children: FlamegraphNode[];
}

export interface TcpRetransmitMetric {
  nodeId: string;
  interfaceName: string;
  retransmitCount: number;
  totalPackets: number;
  rttMs: number;
  timestamp: number;
}

export interface NetworkDropAnomaly {
  nodeId: string;
  isAnomaly: boolean;
  retransmitRatioPercent: number;
  severity: 'normal' | 'warning' | 'critical';
}

export interface EventLoopLagSample {
  expectedIntervalMs: number;
  actualDurationMs: number;
  lagMs: number;
  timestamp: number;
}

export interface EventLoopLagStatus {
  sampleCount: number;
  p50LagMs: number;
  p99LagMs: number;
  isSaturated: boolean;
}

export interface SloWindowMetric {
  windowMinutes: number;
  totalRequests: number;
  failedRequests: number;
  errorRate: number;
}

export interface SloBurnRateAlert {
  sloName: string;
  burnRate1h: number;
  burnRate6h: number;
  triggerPage: boolean;
  triggerTicket: boolean;
  severity: 'none' | 'ticket' | 'page';
  reason: string;
}

export interface LockClaim {
  transactionId: string;
  resourceId: string;
  status: 'held' | 'waiting';
  timestamp: number;
}

export interface DeadlockDetectionResult {
  hasDeadlock: boolean;
  cycle: string[];
  victimTransactionId: string | null;
}

export interface CanaryMetrics {
  version: string;
  requestCount: number;
  errorCount: number;
  p99LatencyMs: number;
}

export interface CanaryRoutingDecision {
  trafficWeightPercent: number;
  action: 'advance' | 'hold' | 'rollback';
  canaryErrorRate: number;
  baselineErrorRate: number;
  reason: string;
}

export interface SpanData {
  traceId: string;
  spanId: string;
  serviceName: string;
  durationMs: number;
  hasError: boolean;
  httpStatusCode?: number;
}

export interface TailSamplingDecision {
  sample: boolean;
  reason: 'error' | 'high_latency' | 'probabilistic' | 'dropped';
}

export interface SocketRttProbe {
  sourceService: string;
  destinationService: string;
  rttMicroseconds: number;
  jitterMicroseconds: number;
  timestamp: number;
}

export interface SocketLatencyStatus {
  p95RttMs: number;
  jitterMs: number;
  isDegraded: boolean;
  recommendation: string;
}
