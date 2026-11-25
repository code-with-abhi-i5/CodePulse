/**
 * Architecture Service: gRPC Streaming Backpressure Regulator
 * Subsystem: Flow Control & Worker Queue Protection
 */

export class GrpcStreamingBackpressureService {
  private readonly highWatermark: number;
  private readonly lowWatermark: number;
  private isPaused = false;

  constructor(highWatermark = 100, lowWatermark = 20) {
    this.highWatermark = highWatermark;
    this.lowWatermark = lowWatermark;
  }

  public evaluateQueueDepth(currentDepth: number): { shouldPause: boolean; shouldResume: boolean } {
    if (!this.isPaused && currentDepth >= this.highWatermark) {
      this.isPaused = true;
      return { shouldPause: true, shouldResume: false };
    }
    if (this.isPaused && currentDepth <= this.lowWatermark) {
      this.isPaused = false;
      return { shouldPause: false, shouldResume: true };
    }
    return { shouldPause: false, shouldResume: false };
  }

  public getPausedStatus(): boolean {
    return this.isPaused;
  }
}
