import { Injectable } from '@nestjs/common';
import { ProgressEventPayload } from '../../types/queues';

@Injectable()
export class ProgressEmitterService {
  private readonly lastEmittedPercentage: Map<string, number> = new Map();

  shouldThrottle(jobId: string, percentage: number, minDeltaPercent: number = 5): boolean {
    const last = this.lastEmittedPercentage.get(jobId);
    if (last === undefined) return false;
    if (percentage >= 100) return false;
    return (percentage - last) < minDeltaPercent;
  }

  emitProgress(jobId: string, percentage: number, checkpointName?: string): ProgressEventPayload {
    this.lastEmittedPercentage.set(jobId, percentage);
    return {
      channel: `job:progress:${jobId}`,
      payload: {
        jobId,
        percentage: Math.min(100, Math.max(0, percentage)),
        checkpointName,
        timestamp: Date.now(),
      },
    };
  }

  formatEvent(jobId: string, percentage: number, checkpointName?: string): string {
    return JSON.stringify(this.emitProgress(jobId, percentage, checkpointName));
  }
}
