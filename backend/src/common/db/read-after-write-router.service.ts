import { ReadRoutingDecision } from '../../types/db';

export class ReadAfterWriteRouterService {
  private readonly writeTimestamps = new Map<string, number>();

  constructor(private readonly consistencyWindowMs: number = 3000) {}

  public recordWrite(sessionOrUserId: string, timestamp: number = Date.now()): void {
    this.writeTimestamps.set(sessionOrUserId, timestamp);
  }

  public routeRead(sessionOrUserId: string, now: number = Date.now()): ReadRoutingDecision {
    const lastWrite = this.writeTimestamps.get(sessionOrUserId);

    if (lastWrite !== undefined) {
      const elapsed = now - lastWrite;
      if (elapsed < this.consistencyWindowMs) {
        return {
          targetNode: 'primary',
          reason: 'recent_write_window',
          windowRemainingMs: this.consistencyWindowMs - elapsed
        };
      } else {
        // Window expired, clean up entry
        this.writeTimestamps.delete(sessionOrUserId);
      }
    }

    return {
      targetNode: 'replica',
      reason: 'replica_healthy'
    };
  }

  public clear(sessionOrUserId: string): void {
    this.writeTimestamps.delete(sessionOrUserId);
  }
}
