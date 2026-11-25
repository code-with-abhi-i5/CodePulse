/**
 * Architecture Service: Prisma Query Execution Timeout Interceptor
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-09]
 */

export class PrismaQueryTimeoutInterceptorService {
  private timeoutMs: number;

  constructor(timeoutMs: number = 3000) {
    this.timeoutMs = timeoutMs;
  }

  public async executeWithTimeout<T>(
    operationName: string,
    queryFn: (signal: AbortSignal) => Promise<T>,
    customTimeoutMs?: number
  ): Promise<T> {
    const duration = customTimeoutMs || this.timeoutMs;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, duration);

    try {
      return await queryFn(controller.signal);
    } catch (err: any) {
      if (controller.signal.aborted) {
        throw new Error(`Query execution timeout: '${operationName}' exceeded ${duration}ms and was cancelled`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
