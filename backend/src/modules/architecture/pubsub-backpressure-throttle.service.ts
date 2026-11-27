export type FramePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Frame<T = any> {
  id: string;
  topic: string;
  payload: T;
  priority: FramePriority;
  timestamp: number;
}

export interface ThrottleStats {
  queued: number;
  droppedLow: number;
  droppedMedium: number;
  delivered: number;
}

export class PubSubBackpressureThrottleService<T = any> {
  private queue: Frame<T>[] = [];
  private highWatermark: number;
  private lowWatermark: number;
  private stats: ThrottleStats = { queued: 0, droppedLow: 0, droppedMedium: 0, delivered: 0 };

  constructor(highWatermark = 50, lowWatermark = 20) {
    this.highWatermark = highWatermark;
    this.lowWatermark = lowWatermark;
  }

  public enqueue(frame: Frame<T>): boolean {
    if (this.queue.length >= this.highWatermark) {
      // Under high load: shed low priority frame
      if (frame.priority === 'LOW') {
        this.stats.droppedLow++;
        return false;
      }
      
      // Try to evict oldest LOW priority from queue to make space for HIGH/MEDIUM
      const lowIndex = this.queue.findIndex(f => f.priority === 'LOW');
      if (lowIndex !== -1) {
        this.queue.splice(lowIndex, 1);
        this.stats.droppedLow++;
        this.queue.push(frame);
        this.stats.queued = this.queue.length;
        return true;
      }

      // If still above highWatermark and new frame is MEDIUM, drop it
      if (frame.priority === 'MEDIUM') {
        this.stats.droppedMedium++;
        return false;
      }
    }

    this.queue.push(frame);
    this.stats.queued = this.queue.length;
    return true;
  }

  public drainBatch(batchSize = 10): Frame<T>[] {
    const drained = this.queue.splice(0, batchSize);
    this.stats.delivered += drained.length;
    this.stats.queued = this.queue.length;
    return drained;
  }

  public getStats(): ThrottleStats {
    return { ...this.stats };
  }

  public isUnderPressure(): boolean {
    return this.queue.length >= this.lowWatermark;
  }

  public clear(): void {
    this.queue = [];
    this.stats.queued = 0;
  }
}
