/**
 * Architecture Service: API Request Cancellation Token Propagator
 * Subsystem: Request Lifecycle & Cooperative Cancellation
 */

export class ApiCancellationPropagatorService {
  private readonly controllers = new Map<string, AbortController>();

  public createToken(requestId: string, timeoutMs?: number): AbortSignal {
    const controller = new AbortController();
    this.controllers.set(requestId, controller);

    if (timeoutMs && timeoutMs > 0) {
      setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort(new Error(`Request ${requestId} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs).unref?.();
    }

    return controller.signal;
  }

  public cancel(requestId: string, reason?: string): void {
    const controller = this.controllers.get(requestId);
    if (controller && !controller.signal.aborted) {
      controller.abort(new Error(reason || 'Client cancelled request'));
    }
  }

  public cleanup(requestId: string): void {
    this.controllers.delete(requestId);
  }
}
