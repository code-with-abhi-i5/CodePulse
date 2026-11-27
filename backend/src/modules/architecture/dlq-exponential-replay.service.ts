export interface DlqMessage {
  id: string;
  topic: string;
  payload: any;
  retryCount: number;
  lastError: string;
  nextRetryAt?: number;
}

export class DLQExponentialReplayCoordinator {
  private baseDelayMs: number;
  private maxDelayMs: number;

  constructor(baseDelayMs = 1000, maxDelayMs = 60000) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  public calculateBackoff(retryCount: number): number {
    // Exponential backoff with full jitter
    const exp = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, retryCount));
    const jitter = Math.random() * (exp * 0.5);
    return Math.floor(Math.min(this.maxDelayMs, exp + jitter));
  }

  public scheduleReplay(msg: DlqMessage): DlqMessage {
    const delay = this.calculateBackoff(msg.retryCount);
    return {
      ...msg,
      retryCount: msg.retryCount + 1,
      nextRetryAt: Date.now() + delay
    };
  }
}
