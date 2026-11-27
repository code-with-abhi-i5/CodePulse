export class TanStackRetryGovernorVerifier {
  public computeDelay(attempt: number, baseMs = 1000, maxMs = 30000): number {
    const backoff = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    return Math.floor(backoff);
  }

  public isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || (status >= 500 && status <= 599);
  }
}
