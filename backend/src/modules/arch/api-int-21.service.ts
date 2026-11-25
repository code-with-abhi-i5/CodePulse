/**
 * Architecture Service: gRPC Keepalive Ping Supervisor
 * Subsystem: Network Transport & Connection Management
 */

export interface KeepaliveConfig {
  pingIntervalMs: number;
  pingTimeoutMs: number;
  permitWithoutStream: boolean;
}

export class GrpcKeepaliveSupervisorService {
  private readonly config: KeepaliveConfig;
  private readonly channelLastPing = new Map<string, number>();

  constructor(config: KeepaliveConfig = { pingIntervalMs: 30000, pingTimeoutMs: 10000, permitWithoutStream: true }) {
    this.config = config;
  }

  public shouldSendPing(channelId: string, now: number = Date.now()): boolean {
    const lastPing = this.channelLastPing.get(channelId) || 0;
    return (now - lastPing) >= this.config.pingIntervalMs;
  }

  public recordPing(channelId: string, timestamp: number = Date.now()): void {
    this.channelLastPing.set(channelId, timestamp);
  }

  public isChannelTimedOut(channelId: string, lastAckTime: number, now: number = Date.now()): boolean {
    const lastPing = this.channelLastPing.get(channelId);
    if (!lastPing) return false;
    if (lastAckTime >= lastPing) return false;
    return (now - lastPing) > this.config.pingTimeoutMs;
  }
}
