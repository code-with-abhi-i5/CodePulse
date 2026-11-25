/**
 * Architecture Service: WebSocket Heartbeat Indicator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-45]
 */

export type ConnectionHealth = 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED';

export class WebSocketHeartbeatMeterService {
  private latencies: number[];
  private maxSamples: number;
  private pendingPingTimestamp: number | null;
  private missedPings: number;
  private maxMissedPings: number;

  constructor(maxSamples: number = 10, maxMissedPings: number = 3) {
    this.latencies = [];
    this.maxSamples = maxSamples;
    this.pendingPingTimestamp = null;
    this.missedPings = 0;
    this.maxMissedPings = maxMissedPings;
  }

  public emitPing(timestamp: number = Date.now()): void {
    if (this.pendingPingTimestamp !== null) {
      this.missedPings++;
    }
    this.pendingPingTimestamp = timestamp;
  }

  public recordPong(pongTimestamp: number = Date.now()): number | null {
    if (this.pendingPingTimestamp === null) return null;
    const rtt = Math.max(0, pongTimestamp - this.pendingPingTimestamp);
    this.pendingPingTimestamp = null;
    this.missedPings = 0;

    this.latencies.push(rtt);
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
    return rtt;
  }

  public getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  }

  public getHealth(): ConnectionHealth {
    if (this.missedPings >= this.maxMissedPings) {
      return 'DISCONNECTED';
    }
    const avg = this.getAverageLatency();
    if (avg <= 50) return 'EXCELLENT';
    if (avg <= 150) return 'GOOD';
    return 'POOR';
  }

  public getReconnectionBackoff(baseMs: number = 1000): number {
    return Math.min(30000, baseMs * Math.pow(2, this.missedPings));
  }
}
