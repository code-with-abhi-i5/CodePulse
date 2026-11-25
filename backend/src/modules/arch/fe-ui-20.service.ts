/**
 * Architecture Service: Frontend Network Resilience Interceptor
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-20]
 */

export interface BufferedMutation {
  id: string;
  url: string;
  method: 'GET' | 'PUT' | 'DELETE' | 'PATCH';
  body: any;
  retryCount: number;
}

export class FrontendNetworkResilienceInterceptorService {
  private buffer: BufferedMutation[];
  private maxRetries: number;

  constructor(maxRetries: number = 3) {
    this.buffer = [];
    this.maxRetries = maxRetries;
  }

  public enqueueFailedMutation(url: string, method: 'GET' | 'PUT' | 'DELETE' | 'PATCH', body: any): BufferedMutation {
    const mutation: BufferedMutation = {
      id: 'mut_' + Math.random().toString(36).substring(2, 8),
      url,
      method,
      body,
      retryCount: 0
    };
    this.buffer.push(mutation);
    return mutation;
  }

  public getPendingMutations(): BufferedMutation[] {
    return [...this.buffer];
  }

  public handleReplaySuccess(mutationId: string): void {
    this.buffer = this.buffer.filter(m => m.id !== mutationId);
  }

  public handleReplayFailure(mutationId: string): boolean {
    const item = this.buffer.find(m => m.id === mutationId);
    if (!item) return false;
    item.retryCount++;
    if (item.retryCount >= this.maxRetries) {
      this.buffer = this.buffer.filter(m => m.id !== mutationId);
      return false; // Dropped after exceeding retries
    }
    return true; // Still queued for retry
  }
}
