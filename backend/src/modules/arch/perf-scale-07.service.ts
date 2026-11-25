/**
 * Architecture Service: HTTP/3 QUIC Connection Pool
 * Subsystem: Advanced System Performance & Scalability [PERF-SCALE-07]
 */

export interface QuicStream {
  streamId: number;
  isBidirectional: boolean;
  priority: number;
  closed: boolean;
}

export class Http3QuicConnectionPoolService {
  private activeStreams: Map<number, QuicStream>;
  private nextStreamId: number;
  private maxConcurrentStreams: number;

  constructor(maxConcurrentStreams: number = 100) {
    this.activeStreams = new Map();
    this.nextStreamId = 1;
    this.maxConcurrentStreams = maxConcurrentStreams;
  }

  public openStream(priority: number = 1, isBidirectional: boolean = true): QuicStream | null {
    if (this.activeStreams.size >= this.maxConcurrentStreams) {
      return null;
    }
    const streamId = this.nextStreamId++;
    const stream: QuicStream = {
      streamId,
      isBidirectional,
      priority,
      closed: false
    };
    this.activeStreams.set(streamId, stream);
    return stream;
  }

  public closeStream(streamId: number): boolean {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return false;
    stream.closed = true;
    this.activeStreams.delete(streamId);
    return true;
  }

  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}
