export interface WebhookEventEnvelope {
  eventId: string;
  deliveryId: string;
  event: string;
  partitionKey: string; // repositoryId or repository.full_name
  signature?: string;
  timestamp: number;
  payload: any;
  retryCount?: number;
  error?: string;
}

export interface EventBridgePublishAck {
  eventId: string;
  deliveryId: string;
  status: 'accepted' | 'queued' | 'published';
  topic: string;
  partitionKey: string;
  latencyMs: number;
  queuedAt: string;
}

export interface EventBridgeMetrics {
  totalIngested: number;
  totalProcessed: number;
  totalFailed: number;
  totalReplayed: number;
  pendingCount: number;
  avgIngestionLatencyMs: number;
  backpressureActive: boolean;
  activePartitions: number;
  partitionsLag: Record<string, number>;
}

export interface FailedEventRecord {
  eventId: string;
  deliveryId: string;
  partitionKey: string;
  event: string;
  payload: any;
  failedAt: number;
  reason: string;
  stack?: string;
  attempts: number;
}

export interface ReplayOptions {
  partitionKey?: string;
  eventType?: string;
  limit?: number;
}

export interface ReplayResult {
  replayedCount: number;
  remainingFailed: number;
  replayedEventIds: string[];
}

