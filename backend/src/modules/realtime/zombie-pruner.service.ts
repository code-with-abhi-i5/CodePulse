import { Injectable, Logger } from '@nestjs/common';
import { HeartbeatSession } from '../../../src/types/realtime';

@Injectable()
export class ZombiePrunerService {
  private readonly logger = new Logger(ZombiePrunerService.name);
  private sessions: Map<string, HeartbeatSession> = new Map();
  private readonly TIMEOUT_MS = 45000; // 45 seconds

  public registerPing(socketId: string): void {
    this.sessions.set(socketId, {
      socketId,
      lastPingAt: Date.now(),
      missedPings: 0,
      isHealthy: true
    });
  }

  public pruneOrphanedSockets(): string[] {
    const now = Date.now();
    const pruned: string[] = [];

    for (const [socketId, session] of this.sessions.entries()) {
      if (now - session.lastPingAt > this.TIMEOUT_MS) {
        pruned.push(socketId);
        this.sessions.delete(socketId);
      }
    }
    return pruned;
  }

  public getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
