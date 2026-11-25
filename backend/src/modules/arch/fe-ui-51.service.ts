/**
 * Architecture Service: Rate Limit Backoff Visualizer
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-51]
 */

export interface BackoffState {
  isBlocked: boolean;
  remainingSeconds: number;
  route: string;
  unlockTimestamp: number;
}

export class RateLimitBackoffVisualizerService {
  private activeLocks: Map<string, number>;

  constructor() {
    this.activeLocks = new Map();
  }

  public recordRateLimit(route: string, retryAfterSeconds: number, now: number = Date.now()): void {
    const unlockTimestamp = now + retryAfterSeconds * 1000;
    this.activeLocks.set(route, unlockTimestamp);
  }

  public getBackoffState(route: string, now: number = Date.now()): BackoffState {
    const unlock = this.activeLocks.get(route);
    if (!unlock || now >= unlock) {
      if (unlock) this.activeLocks.delete(route);
      return {
        isBlocked: false,
        remainingSeconds: 0,
        route,
        unlockTimestamp: 0
      };
    }

    const remainingSeconds = Math.ceil((unlock - now) / 1000);
    return {
      isBlocked: true,
      remainingSeconds,
      route,
      unlockTimestamp: unlock
    };
  }

  public formatCountdown(remainingSeconds: number): string {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
