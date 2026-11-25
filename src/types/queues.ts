export interface WorkerAutoscalerMetrics {
  p50: number;
  p95: number;
  p99: number;
}

export interface DlqFailureResult {
  action: 'retry' | 'quarantine';
  delayMs: number;
}

export interface StreamConsumer {
  consumerId: string;
  lastHeartbeat: number;
}

export interface ScheduledTask<T = any> {
  taskId: string;
  executeAt: number;
  payload: T;
}

export interface BatchLimits {
  maxSize: number;
  maxIntervalMs: number;
}

export interface FairTierJob<T = any> {
  tier: 'enterprise' | 'pro' | 'free';
  job: T;
}

export interface ProgressEventPayload {
  channel: string;
  payload: {
    jobId: string;
    percentage: number;
    checkpointName?: string;
    timestamp: number;
  };
}

export interface RouteTarget {
  slot: number;
  node: string;
}
