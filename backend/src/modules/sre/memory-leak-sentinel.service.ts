import { HeapSnapshot, LeakAnalysis } from '../../types/sre';

export class MemoryLeakSentinel {
  private snapshots: Map<number | string, HeapSnapshot[]> = new Map();
  private readonly minSnapshotsForDetection: number = 4;
  private readonly leakSlopeBytesPerMinThreshold: number = 1024 * 1024;

  recordSnapshot(snapshot: HeapSnapshot): void {
    if (!this.snapshots.has(snapshot.threadId)) {
      this.snapshots.set(snapshot.threadId, []);
    }
    const list = this.snapshots.get(snapshot.threadId)!;
    list.push(snapshot);
    if (list.length > 20) {
      list.shift();
    }
  }

  analyzeThread(threadId: number | string): LeakAnalysis {
    const list = this.snapshots.get(threadId);
    if (!list || list.length < this.minSnapshotsForDetection) {
      return {
        threadId,
        isLeaking: false,
        growthRateBytesPerMin: 0,
        consecutiveGrowthCycles: 0,
        confidence: 'low',
        triggerHeapDump: false
      };
    }

    let consecutiveGrowth = 0;
    for (let i = 1; i < list.length; i++) {
      if (list[i].heapUsedBytes > list[i - 1].heapUsedBytes) {
        consecutiveGrowth++;
      }
    }

    const first = list[0];
    const last = list[list.length - 1];
    const timeSpanMinutes = Math.max(0.1, (last.timestamp - first.timestamp) / 60000);
    const growthBytes = last.heapUsedBytes - first.heapUsedBytes;
    const growthRate = growthBytes / timeSpanMinutes;

    const isLeaking = consecutiveGrowth >= 3 && growthRate > this.leakSlopeBytesPerMinThreshold;
    const confidence = consecutiveGrowth >= 5 ? 'high' : (consecutiveGrowth >= 3 ? 'medium' : 'low');

    return {
      threadId,
      isLeaking,
      growthRateBytesPerMin: Math.round(growthRate),
      consecutiveGrowthCycles: consecutiveGrowth,
      confidence,
      triggerHeapDump: isLeaking && confidence === 'high'
    };
  }

  getAllAlerts(): LeakAnalysis[] {
    const alerts: LeakAnalysis[] = [];
    for (const threadId of this.snapshots.keys()) {
      const analysis = this.analyzeThread(threadId);
      if (analysis.isLeaking) {
        alerts.push(analysis);
      }
    }
    return alerts;
  }
}
