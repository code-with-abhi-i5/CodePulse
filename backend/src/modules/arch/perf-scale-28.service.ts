/**
 * Architecture Service: Microservice Keep-Alive Connection Pool
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-28]
 */

export interface PooledSocket {
  id: string;
  host: string;
  lastUsed: number;
}

export class MicroserviceKeepAlivePoolService {
  private maxSockets: number;
  private idleTimeoutMs: number;
  private freeSockets: Map<string, PooledSocket[]>;
  private reusedCount: number;
  private totalCount: number;

  constructor(maxSockets: number = 50, idleTimeoutMs: number = 30000) {
    this.maxSockets = maxSockets;
    this.idleTimeoutMs = idleTimeoutMs;
    this.freeSockets = new Map();
    this.reusedCount = 0;
    this.totalCount = 0;
  }

  public acquireSocket(host: string, now: number = Date.now()): { socketId: string; isReused: boolean } {
    this.totalCount++;
    this.reapIdleSockets(now);

    const list = this.freeSockets.get(host) || [];
    if (list.length > 0) {
      const sock = list.pop()!;
      this.reusedCount++;
      return { socketId: sock.id, isReused: true };
    }

    const newId = `sock_${Math.random().toString(36).substring(2, 7)}`;
    return { socketId: newId, isReused: false };
  }

  public releaseSocket(host: string, socketId: string, now: number = Date.now()): void {
    if (!this.freeSockets.has(host)) {
      this.freeSockets.set(host, []);
    }
    const list = this.freeSockets.get(host)!;
    if (list.length < this.maxSockets) {
      list.push({ id: socketId, host, lastUsed: now });
    }
  }

  public reapIdleSockets(now: number = Date.now()): number {
    let reaped = 0;
    for (const [host, list] of this.freeSockets.entries()) {
      const fresh = list.filter(s => now - s.lastUsed < this.idleTimeoutMs);
      reaped += (list.length - fresh.length);
      this.freeSockets.set(host, fresh);
    }
    return reaped;
  }

  public getReuseRatio(): number {
    return this.totalCount > 0 ? Math.round((this.reusedCount / this.totalCount) * 100) : 0;
  }
}
