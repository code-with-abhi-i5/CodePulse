/**
 * Architecture Service: Telemetry Event Sampler
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-24]
 */

export interface TelemetryEvent {
  type: string;
  data: Record<string, any>;
  timestamp: number;
}

export class TelemetryEventSamplerService {
  private throttleIntervalMs: number;
  private lastEmitTimes: Map<string, number>;
  private batch: TelemetryEvent[];

  constructor(throttleIntervalMs: number = 100) {
    this.throttleIntervalMs = throttleIntervalMs;
    this.lastEmitTimes = new Map();
    this.batch = [];
  }

  public recordEvent(type: string, data: Record<string, any>): boolean {
    const now = Date.now();
    const lastTime = this.lastEmitTimes.get(type) || 0;

    if (now - lastTime < this.throttleIntervalMs) {
      return false; // Throttled
    }

    this.lastEmitTimes.set(type, now);
    this.batch.push({ type, data, timestamp: now });
    return true;
  }

  public flushBatch(): TelemetryEvent[] {
    const events = [...this.batch];
    this.batch = [];
    return events;
  }
}
