import { InFlightMessage, ShutdownStatus } from '../../types/sre';

export class GracefulShutdownCoordinator {
  private inFlight: Map<string, InFlightMessage> = new Map();
  private state: 'running' | 'shutting_down' | 'terminated' = 'running';
  private drainedCount: number = 0;

  trackMessage(msg: InFlightMessage): boolean {
    if (this.state !== 'running') {
      return false;
    }
    this.inFlight.set(msg.messageId, msg);
    return true;
  }

  ackMessage(messageId: string): void {
    if (this.inFlight.delete(messageId)) {
      this.drainedCount++;
    }
  }

  async initiateShutdown(graceTimeoutMs: number = 5000): Promise<ShutdownStatus> {
    const startTime = Date.now();
    this.state = 'shutting_down';

    const checkIntervalMs = 50;
    let elapsed = 0;
    let forcedClose = false;

    while (this.inFlight.size > 0 && elapsed < graceTimeoutMs) {
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
      elapsed = Date.now() - startTime;
    }

    if (this.inFlight.size > 0) {
      forcedClose = true;
      this.inFlight.clear();
    }

    this.state = 'terminated';
    return {
      state: 'terminated',
      inFlightCount: 0,
      drainedCount: this.drainedCount,
      forcedClose,
      durationMs: Date.now() - startTime
    };
  }

  getStatus(): ShutdownStatus {
    return {
      state: this.state,
      inFlightCount: this.inFlight.size,
      drainedCount: this.drainedCount,
      forcedClose: false,
      durationMs: 0
    };
  }
}
