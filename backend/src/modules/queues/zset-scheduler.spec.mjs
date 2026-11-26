import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ZsetSchedulerService {
  constructor() {
    this.tasks = [];
  }

  scheduleTask(taskId, executeAtEpochMs, payload) {
    this.tasks.push({ taskId, executeAt: executeAtEpochMs, payload });
    this.tasks.sort((a, b) => a.executeAt - b.executeAt);
  }

  pollDueTasks(currentEpochMs, maxCount = 100) {
    const due = [];
    while (this.tasks.length > 0 && this.tasks[0].executeAt <= currentEpochMs && due.length < maxCount) {
      due.push(this.tasks.shift());
    }
    return due;
  }

  cancelTask(taskId) {
    const idx = this.tasks.findIndex(t => t.taskId === taskId);
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      return true;
    }
    return false;
  }

  getQueueSize() {
    return this.tasks.length;
  }
}

describe('ZsetSchedulerService', () => {
  it('schedules millisecond tasks and triggers them in deterministic order', () => {
    const service = new ZsetSchedulerService();
    const now = 1000000;
    service.scheduleTask('match-start', now + 200, { round: 1 });
    service.scheduleTask('warmup', now - 50, { ready: true });
    service.scheduleTask('match-end', now + 500, { round: 1 });

    const due = service.pollDueTasks(now);
    assert.equal(due.length, 1);
    assert.equal(due[0].taskId, 'warmup');

    const dueLater = service.pollDueTasks(now + 300);
    assert.equal(dueLater.length, 1);
    assert.equal(dueLater[0].taskId, 'match-start');
  });
});
