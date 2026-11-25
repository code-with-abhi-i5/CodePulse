/**
 * Architecture Service: Prisma Transaction Retry Coordinator
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-17]
 */

export class PrismaTransactionRetryCoordinatorService {
  private maxRetries: number;
  private baseBackoffMs: number;

  constructor(maxRetries: number = 3, baseBackoffMs: number = 50) {
    this.maxRetries = maxRetries;
    this.baseBackoffMs = baseBackoffMs;
  }

  public isTransientError(error: any): boolean {
    const message = error ? String(error.message || error.code || '') : '';
    return (
      message.includes('40P01') || // deadlock_detected
      message.includes('40001') || // serialization_failure
      message.includes('deadlock') ||
      message.includes('could not serialize access')
    );
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((res) => setTimeout(res, ms))
  ): Promise<{ result: T; attempts: number }> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      attempts++;
      try {
        const result = await operation();
        return { result, attempts };
      } catch (err: any) {
        if (!this.isTransientError(err) || attempts >= this.maxRetries) {
          throw err;
        }
        const backoff = this.baseBackoffMs * Math.pow(2, attempts - 1) + Math.floor(Math.random() * 20);
        await sleepFn(backoff);
      }
    }

    throw new Error('Transaction retry exceeded maximum attempts');
  }
}
