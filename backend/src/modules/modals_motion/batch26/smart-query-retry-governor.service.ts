export class SmartQueryRetryGovernor {
  calculateDelay(failureCount: number, baseMs = 1000, maxMs = 30000): number {
    const backoff = Math.min(maxMs, baseMs * Math.pow(2, failureCount));
    const jitter = Math.floor(Math.random() * (backoff * 0.2));
    return backoff + jitter;
  }

  shouldRetry(statusCode: number, failureCount: number, maxAttempts = 3): boolean {
    if (failureCount >= maxAttempts) return false;
    // Do not retry 4xx client errors except 408 (Timeout) and 429 (Rate Limited)
    if (statusCode >= 400 && statusCode < 500) {
      return statusCode === 408 || statusCode === 429;
    }
    // Retry on 5xx server errors and network dropouts (status 0)
    return statusCode >= 500 || statusCode === 0;
  }
}
