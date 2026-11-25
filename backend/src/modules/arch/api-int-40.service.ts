/**
 * Architecture Service: gRPC Deadline Propagation Interceptor
 * Subsystem: Distributed Call Timeouts & Resource Reclamation
 */

export class GrpcDeadlinePropagationService {
  public calculateRemainingDeadlineMs(deadlineTimestampMs: number, now: number = Date.now()): number {
    const remaining = deadlineTimestampMs - now;
    return remaining > 0 ? remaining : 0;
  }

  public isExpired(deadlineTimestampMs: number, now: number = Date.now()): boolean {
    return now >= deadlineTimestampMs;
  }
}
