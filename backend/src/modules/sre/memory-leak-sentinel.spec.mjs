import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryLeakSentinel {
  constructor() {
    this.snapshots = new Map();
    this.minSnapshotsForDetection = 4;
    this.leakSlopeBytesPerMinThreshold = 1024 * 1024;
  }

  recordSnapshot(snapshot) {
    if (!this.snapshots.has(snapshot.threadId)) {
      this.snapshots.set(snapshot.threadId, []);
    }
    const list = this.snapshots.get(snapshot.threadId);
    list.push(snapshot);
    if (list.length > 20) {
      list.shift();
    }
  }

  analyzeThread(threadId) {
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

  getAllAlerts() {
    const alerts = [];
    for (const threadId of this.snapshots.keys()) {
      const analysis = this.analyzeThread(threadId);
      if (analysis.isLeaking) {
        alerts.push(analysis);
      }
    }
    return alerts;
  }
}

test('MemoryLeakSentinel - detects sustained heap growth across worker threads', () => {
  const sentinel = new MemoryLeakSentinel();
  const now = Date.now();
  for (let i = 0; i < 6; i++) {
    sentinel.recordSnapshot({
      threadId: 'worker-1',
      heapUsedBytes: 50 * 1024 * 1024 + i * 5 * 1024 * 1024,
      heapTotalBytes: 120 * 1024 * 1024,
      timestamp: now + i * 60000
    });
  }

  const analysis = sentinel.analyzeThread('worker-1');
  assert.strictEqual(analysis.isLeaking, true);
  assert.strictEqual(analysis.confidence, 'high');
  assert.strictEqual(analysis.triggerHeapDump, true);

  // Fluctuating healthy worker
  sentinel.recordSnapshot({ threadId: 'worker-2', heapUsedBytes: 30 * 1024 * 1024, heapTotalBytes: 60 * 1024 * 1024, timestamp: now });
  sentinel.recordSnapshot({ threadId: 'worker-2', heapUsedBytes: 50 * 1024 * 1024, heapTotalBytes: 60 * 1024 * 1024, timestamp: now + 60000 });
  sentinel.recordSnapshot({ threadId: 'worker-2', heapUsedBytes: 25 * 1024 * 1024, heapTotalBytes: 60 * 1024 * 1024, timestamp: now + 120000 });
  sentinel.recordSnapshot({ threadId: 'worker-2', heapUsedBytes: 35 * 1024 * 1024, heapTotalBytes: 60 * 1024 * 1024, timestamp: now + 180000 });
  assert.strictEqual(sentinel.analyzeThread('worker-2').isLeaking, false);
});
