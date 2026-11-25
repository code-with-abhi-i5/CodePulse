/**
 * Architecture Service: gRPC Server-Side Streaming Heartbeat Injector
 * Subsystem: API Communication Protocols & Ingress Management [API-INT-61]
 */

export interface StreamClient {
  id: string;
  isOpen: boolean;
  lastAckTimestamp: number;
  sendFrame: (frame: { type: 'data' | 'heartbeat'; payload: unknown }) => void;
  close: (code: number, reason: string) => void;
}

export class GrpcHeartbeatInjectorService {
  private activeStreams: Map<string, StreamClient>;
  private heartbeatIntervalMs: number;
  private timeoutWindowMs: number;

  constructor(heartbeatIntervalMs: number = 5000, timeoutWindowMs: number = 15000) {
    this.activeStreams = new Map();
    this.heartbeatIntervalMs = heartbeatIntervalMs;
    this.timeoutWindowMs = timeoutWindowMs;
  }

  public registerStream(stream: StreamClient): void {
    this.activeStreams.set(stream.id, stream);
  }

  public acknowledgeHeartbeat(streamId: string, timestamp: number = Date.now()): boolean {
    const stream = this.activeStreams.get(streamId);
    if (!stream || !stream.isOpen) return false;
    stream.lastAckTimestamp = timestamp;
    return true;
  }

  public broadcastHeartbeats(): number {
    let sentCount = 0;
    for (const stream of this.activeStreams.values()) {
      if (stream.isOpen) {
        stream.sendFrame({ type: 'heartbeat', payload: { ping: Date.now() } });
        sentCount++;
      }
    }
    return sentCount;
  }

  public detectAndReapAbandonedConnections(now: number = Date.now()): string[] {
    const reapedIds: string[] = [];
    for (const [id, stream] of this.activeStreams.entries()) {
      if (!stream.isOpen || now - stream.lastAckTimestamp > this.timeoutWindowMs) {
        if (stream.isOpen) {
          stream.close(1001, 'Heartbeat timeout - connection abandoned');
        }
        reapedIds.push(id);
        this.activeStreams.delete(id);
      }
    }
    return reapedIds;
  }

  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}
