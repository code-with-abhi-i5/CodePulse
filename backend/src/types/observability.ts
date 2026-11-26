export interface BaggageEntry {
  key: string;
  value: string;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
  baggage: Record<string, string>;
}

export interface PrometheusAlert {
  id: string;
  alertname: string;
  pod: string;
  namespace: string;
  severity: 'critical' | 'warning' | 'info';
  startsAt: string;
  labels: Record<string, string>;
}

export interface CorrelatedIncident {
  incidentId: string;
  rootAlert: PrometheusAlert;
  correlatedAlerts: PrometheusAlert[];
  pod: string;
  namespace: string;
  totalAlerts: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface EbpfProfileSample {
  timestamp: number;
  pid: number;
  comm: string;
  stackTrace: string[];
  offCpuDurationNs: number;
  lockSymbol?: string;
}

export interface OffCpuStats {
  totalDurationNs: number;
  sampleCount: number;
  p50Ns: number;
  p90Ns: number;
  p99Ns: number;
  topBottlenecks: { symbol: string; durationNs: number; count: number }[];
}

export interface ChaosExperimentConfig {
  name: string;
  targetService: string;
  latencyMs?: number;
  packetDropRate?: number;
  safeHaltThresholdErrors?: number;
}

export interface ChaosExperimentResult {
  experimentId: string;
  status: 'running' | 'completed' | 'halted';
  injectedLatencyMs: number;
  droppedPackets: number;
  totalRequests: number;
  errorRate: number;
  safetyTripped: boolean;
}

export interface LokiBatchResult {
  streamsCount: number;
  totalLines: number;
  totalBytes: number;
  compressedBytes: number;
  droppedLines: number;
  bufferOccupancyPercent: number;
}

export interface SloConfig {
  serviceName: string;
  sliName: string;
  sloTarget: number;
  windowMinutes: number;
}

export interface BurnRateAlert {
  serviceName: string;
  sliName: string;
  burnRate: number;
  budgetConsumedPercent: number;
  timeToExhaustionHours: number;
  severity: 'critical' | 'warning' | 'normal';
  triggered: boolean;
}

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUs: number;
  durationUs: number;
}

export interface FlamegraphNode {
  name: string;
  value: number;
  selfTimeUs: number;
  percentOfTotal: number;
  children: FlamegraphNode[];
}

export interface SyntheticProbeStep {
  stepName: string;
  status: 'passed' | 'failed';
  durationMs: number;
}

export interface SyntheticProbeRun {
  probeId: string;
  journeyName: string;
  timestamp: string;
  success: boolean;
  totalDurationMs: number;
  steps: SyntheticProbeStep[];
}

export interface DoraMetrics {
  deploymentFrequencyPerDay: number;
  leadTimeForChangesMinutes: number;
  meanTimeToRestoreMinutes: number;
  changeFailureRatePercent: number;
  doraTier: 'elite' | 'high' | 'medium' | 'low';
}

export interface HeapNode {
  id: number;
  name: string;
  type: 'object' | 'closure' | 'dom' | 'array';
  retainedSize: number;
  detachedDom: boolean;
}

export interface HeapAnalysisReport {
  totalNodes: number;
  totalRetainedBytes: number;
  detachedDomNodesCount: number;
  detachedDomBytes: number;
  leakSuspects: HeapNode[];
}
