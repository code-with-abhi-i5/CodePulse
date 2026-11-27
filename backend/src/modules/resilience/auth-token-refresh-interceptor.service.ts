export interface QueuedRequest {
  id: string;
  retry: (newToken: string) => Promise<any>;
}

export class AuthTokenRefreshInterceptorService {
  private isRefreshing = false;
  private queue: QueuedRequest[] = [];

  public isRefreshInProgress(): boolean {
    return this.isRefreshing;
  }

  public enqueueRequest(request: QueuedRequest): void {
    this.queue.push(request);
  }

  public async handle401Error(
    refreshTokenFn: () => Promise<string | null>
  ): Promise<{ refreshed: boolean; newToken?: string; error?: string }> {
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.enqueueRequest({
          id: Math.random().toString(),
          retry: async (token) => {
            resolve({ refreshed: true, newToken: token });
          }
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await refreshTokenFn();
      if (!newToken) {
        this.queue = [];
        return { refreshed: false, error: 'Token refresh returned null or invalid token' };
      }

      // Drain queued requests
      const pending = [...this.queue];
      this.queue = [];
      await Promise.all(pending.map(req => req.retry(newToken)));

      return { refreshed: true, newToken };
    } catch (err: any) {
      this.queue = [];
      return { refreshed: false, error: err?.message || String(err) };
    } finally {
      this.isRefreshing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
