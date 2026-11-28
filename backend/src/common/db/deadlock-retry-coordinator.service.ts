import { DeadlockRetryConfig } from '../../types/db';

export class DeadlockRetryCoordinatorService {
  constructor(private readonly config: DeadlockRetryConfig = { maxRetries: 3, initialBackoffMs: 50, maxBackoffMs: 1000 }) {}

  public isDeadlockError(error: any): boolean {
    const code = error?.code || '';
    const message = (error?.message || '').toLowerCase();
    return code === '40P01' || code === '40001' || message.includes('deadlock detected') || message.includes('could not serialize access');
  }

  public calculateBackoff(attempt: number, randomMultiplier: number = Math.random()): number {
    const base = this.config.initialBackoffMs * Math.pow(2, attempt);
    const clamped = Math.min(base, this.config.maxBackoffMs);
    // Full jitter
    return Math.floor(clamped * randomMultiplier);
  }

  public async executeWithRetry<T>(operation: (attempt: number) => Promise<T>): Promise<{ result: T; attempts: number }> {
    let lastError: any;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation(attempt);
        return { result, attempts: attempt + 1 };
      } catch (err: any) {
        lastError = err;
        if (!this.isDeadlockError(err) || attempt === this.config.maxRetries) {
          throw err;
        }
      }
    }
    throw lastError;
  }
}
