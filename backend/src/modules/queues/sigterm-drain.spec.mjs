import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class SigtermDrainService {
  constructor() {
    this.activeTasks = new Set();
    this.isTerminating = false;
  }

  registerInFlightTask(taskId) {
    if (this.isTerminating) throw new Error('Terminating');
    this.activeTasks.add(taskId);
  }

  completeTask(taskId) {
    this.activeTasks.delete(taskId);
  }

  isShuttingDown() {
    return this.isTerminating;
  }

  getActiveTaskCount() {
    return this.activeTasks.size;
  }

  async triggerGracefulShutdown(timeoutMs = 5000) {
    this.isTerminating = true;
    const start = Date.now();
    const initialCount = this.activeTasks.size;
    while (this.activeTasks.size > 0 && (Date.now() - start) < timeoutMs) {
      await new Promise(r => setTimeout(r, 10));
    }
    return {
      success: this.activeTasks.size === 0,
      drainedCount: initialCount - this.activeTasks.size,
    };
  }
}

describe('SigtermDrainService', () => {
  it('drains tasks gracefully without dropping in-flight executions', async () => {
    const service = new SigtermDrainService();
    service.registerInFlightTask('t1');
    service.registerInFlightTask('t2');

    setTimeout(() => service.completeTask('t1'), 20);
    setTimeout(() => service.completeTask('t2'), 40);

    const result = await service.triggerGracefulShutdown(500);
    assert.equal(result.success, true);
    assert.equal(result.drainedCount, 2);
    assert.throws(() => service.registerInFlightTask('t3'), /Terminating/);
  });
});
