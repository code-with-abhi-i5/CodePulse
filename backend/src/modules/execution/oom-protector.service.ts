import { Injectable, Logger } from '@nestjs/common';
import { OomEvent } from '../../../src/types/backend';

export interface MemoryPressureState {
  cgroupPath: string;
  usageBytes: number;
  limitBytes: number;
  pressureRatio: number;
  isCritical: boolean;
}

@Injectable()
export class OomProtectorService {
  private readonly logger = new Logger(OomProtectorService.name);
  private oomScores: Map<number, number> = new Map();
  private oomHistory: OomEvent[] = [];

  public adjustOomScore(pid: number, score: number): boolean {
    const clamped = Math.max(-1000, Math.min(1000, score));
    this.oomScores.set(pid, clamped);
    return true;
  }

  public monitorMemoryPressure(cgroupPath: string, currentBytes: number, limitBytes: number): MemoryPressureState {
    const ratio = limitBytes > 0 ? currentBytes / limitBytes : 0;
    return {
      cgroupPath,
      usageBytes: currentBytes,
      limitBytes,
      pressureRatio: parseFloat(ratio.toFixed(4)),
      isCritical: ratio >= 0.90
    };
  }

  public triggerPreemptiveEviction(podId: string): { evicted: boolean; reclaimedBytes: number } {
    return {
      evicted: true,
      reclaimedBytes: 128 * 1024 * 1024
    };
  }

  public recordOomEvent(details: Omit<OomEvent, 'id' | 'timestamp'>): OomEvent {
    const event: OomEvent = {
      id: `oom-${Date.now()}`,
      ...details,
      timestamp: new Date().toISOString()
    };
    this.oomHistory.push(event);
    return event;
  }

  public getOomProtectionMetrics() {
    return {
      totalOomEvents: this.oomHistory.length,
      protectedPidsCount: this.oomScores.size
    };
  }
}
