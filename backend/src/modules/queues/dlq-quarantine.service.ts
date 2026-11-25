import { Injectable } from '@nestjs/common';
import { DlqFailureResult } from '../../types/queues';

@Injectable()
export class DlqQuarantineService {
  private readonly quarantined: Map<string, { quarantinedAt: number; reason: string }> = new Map();
  private readonly failureCounts: Map<string, number> = new Map();

  calculateExponentialBackoff(attempt: number, baseMs: number = 1000, maxMs: number = 60000): number {
    const raw = baseMs * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 200);
    return Math.min(maxMs, raw + jitter);
  }

  processFailure(jobId: string, error: string, attempt: number, maxAttempts: number = 5): DlqFailureResult {
    if (attempt >= maxAttempts) {
      this.quarantineJob(jobId, error);
      return { action: 'quarantine', delayMs: 0 };
    }
    const delayMs = this.calculateExponentialBackoff(attempt);
    return { action: 'retry', delayMs };
  }

  quarantineJob(jobId: string, reason: string): { quarantinedAt: number; jobId: string; reason: string } {
    const record = { quarantinedAt: Date.now(), reason };
    this.quarantined.set(jobId, record);
    return { ...record, jobId };
  }

  tripCircuitBreaker(queueName: string, failureThreshold: number = 10): boolean {
    const count = (this.failureCounts.get(queueName) || 0) + 1;
    this.failureCounts.set(queueName, count);
    return count >= failureThreshold;
  }
}
