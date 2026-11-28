import { RateGovernorResult } from '../../types/security';

export class SlidingWindowRateGovernorService {
  private readonly clientLog = new Map<string, number[]>();

  constructor(
    private readonly maxRequestsPerWindow: number = 100,
    private readonly windowSizeMs: number = 60000
  ) {}

  public recordRequest(clientId: string, now: number = Date.now()): RateGovernorResult {
    const timestamps = (this.clientLog.get(clientId) || []).filter(t => now - t <= this.windowSizeMs);

    if (timestamps.length >= this.maxRequestsPerWindow) {
      const oldestInWindow = timestamps[0];
      const retryAfterSeconds = Math.ceil((this.windowSizeMs - (now - oldestInWindow)) / 1000);
      return {
        allowed: false,
        tokensRemaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
        currentBurst: timestamps.length
      };
    }

    timestamps.push(now);
    this.clientLog.set(clientId, timestamps);

    return {
      allowed: true,
      tokensRemaining: this.maxRequestsPerWindow - timestamps.length,
      retryAfterSeconds: 0,
      currentBurst: timestamps.length
    };
  }
}
