import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ProgressEmitterService {
  constructor() {
    this.lastEmittedPercentage = new Map();
  }

  shouldThrottle(jobId, percentage, minDeltaPercent = 5) {
    const last = this.lastEmittedPercentage.get(jobId);
    if (last === undefined) return false;
    if (percentage >= 100) return false;
    return (percentage - last) < minDeltaPercent;
  }

  emitProgress(jobId, percentage, checkpointName) {
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

  formatEvent(jobId, percentage, checkpointName) {
    return JSON.stringify(this.emitProgress(jobId, percentage, checkpointName));
  }
}

describe('ProgressEmitterService', () => {
  it('streams progress checkpoints with throttling to prevent pubsub saturation', () => {
    const service = new ProgressEmitterService();
    const event1 = service.emitProgress('test-1', 10, 'compiling');
    assert.equal(event1.channel, 'job:progress:test-1');
    assert.equal(event1.payload.percentage, 10);

    assert.equal(service.shouldThrottle('test-1', 12), true);
    assert.equal(service.shouldThrottle('test-1', 25), false);
    assert.equal(service.shouldThrottle('test-1', 100), false);
  });
});
