import { ReconnectionSchedule } from '../../types/sre';

export class DbConnectionStormLimiter {
  private baseDelayMs: number;
  private maxDelayMs: number;

  constructor(baseDelayMs: number = 100, maxDelayMs: number = 10000) {
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  calculateJitteredDelay(clientId: string, attempt: number): ReconnectionSchedule {
    const exponential = Math.min(this.baseDelayMs * Math.pow(2, attempt - 1), this.maxDelayMs);
    const jitter = Math.floor(Math.random() * (exponential * 0.5));
    const delayMs = exponential + jitter;

    return {
      clientId,
      attempt,
      delayMs,
      maxJitterMs: Math.floor(exponential * 0.5)
    };
  }
}
