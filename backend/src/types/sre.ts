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

export interface GcPauseEvent {
  kind: 'major' | 'minor' | 'incremental';
  durationMs: number;
  timestamp: number;
  heapUsedBeforeBytes: number;
  heapUsedAfterBytes: number;
}

export interface GcDampenerStatus {
  totalEvents: number;
  averagePauseMs: number;
  p95PauseMs: number;
  isThrottled: boolean;
  suggestIncremental: boolean;
  throttleRatio: number;
}

export interface LatencySample {
  durationMs: number;
  endpoint: string;
  timestamp: number;
}

export interface BucketCalibrationResult {
  recommendedBuckets: number[];
  observedP50: number;
  observedP90: number;
  observedP99: number;
  bucketCount: number;
  errorMarginPercent: number;
}

export interface TimelineEntry {
  timestamp: number;
  source: 'slack' | 'datadog' | 'pagerduty' | 'github';
  author?: string;
  message: string;
  severity?: 'info' | 'warn' | 'critical';
}

export interface IncidentMetadata {
  incidentId: string;
  title: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3';
  startTime: number;
  detectionTime: number;
  resolvedTime: number;
  leadCommander: string;
  affectedServices: string[];
}

export interface PostMortemDocument {
  incidentId: string;
  markdown: string;
  ttdMinutes: number;
  ttrMinutes: number;
  actionItemsCount: number;
}

export interface ChaosExperimentConfig {
  experimentId: string;
  targetService: string;
  faultType: 'latency' | 'packet_loss' | 'http_503';
  magnitudeMs?: number;
  dropRatePercent?: number;
  allowedOffPeakHoursUtc: number[];
  maxAllowedErrorRatePercent: number;
}

export interface ChaosExecutionResult {
  experimentId: string;
  executed: boolean;
  aborted: boolean;
  reason?: string;
  simulatedDelayMs: number;
}

export interface ChallengeDefinition {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  popularityScore: number;
  testHarnessCode: string;
}

export interface WarmupProgress {
  totalChallenges: number;
  loadedChallenges: number;
  failedChallenges: number;
  durationMs: number;
  isComplete: boolean;
}

export interface QuicSession {
  connectionId: string;
  userId: string;
  clientIp: string;
  clientPort: number;
  pathChallengeNonce?: string;
  pathValidated: boolean;
  lastActiveAt: number;
}

export interface MigrationResult {
  success: boolean;
  connectionId: string;
  oldIp: string;
  newIp: string;
  pathValidated: boolean;
  reason?: string;
}

export interface InFlightMessage {
  messageId: string;
  connectionId: string;
  payloadSize: number;
  queuedAt: number;
}

export interface ShutdownStatus {
  state: 'running' | 'shutting_down' | 'terminated';
  inFlightCount: number;
  drainedCount: number;
  forcedClose: boolean;
  durationMs: number;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface BreakerEvent {
  serviceKey: string;
  replicaId: string;
  state: CircuitBreakerState;
  consecutiveFailures: number;
  timestamp: number;
}

export interface SharedBreakerStatus {
  serviceKey: string;
  state: CircuitBreakerState;
  totalFailuresAcrossReplicas: number;
  activeReplicasTripped: number;
  allowRequest: boolean;
}

export interface AutoscalerConfig {
  minReplicas: number;
  maxReplicas: number;
  targetBacklogPerPod: number;
  scaleUpFactor: number;
  scaleDownDampeningMinutes: number;
}

export interface AutoscalerDecision {
  currentReplicas: number;
  desiredReplicas: number;
  totalBacklog: number;
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
}

export interface HeapSnapshot {
  threadId: number | string;
  heapUsedBytes: number;
  heapTotalBytes: number;
  timestamp: number;
}

export interface LeakAnalysis {
  threadId: number | string;
  isLeaking: boolean;
  growthRateBytesPerMin: number;
  consecutiveGrowthCycles: number;
  confidence: 'low' | 'medium' | 'high';
  triggerHeapDump: boolean;
}

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
