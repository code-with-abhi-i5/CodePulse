export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export class TanStackQueryRetryGovernorService {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelayMs: config.baseDelayMs || 1000,
      maxDelayMs: config.maxDelayMs || 15000
    };
  }

  public shouldRetry(failureCount: number, error: { status?: number; code?: string }): boolean {
    if (failureCount >= this.config.maxRetries) {
      return false;
    }

    // Do NOT retry 4xx client errors (400, 401, 403, 404, 422)
    if (error.status && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
      return false;
    }

    return true; // Retry network errors and 5xx
  }

  public calculateRetryDelay(attemptIndex: number): number {
    const exp = Math.min(this.config.maxDelayMs, this.config.baseDelayMs * Math.pow(2, attemptIndex));
    const jitter = Math.random() * (exp * 0.25);
    return Math.floor(exp + jitter);
  }
}
