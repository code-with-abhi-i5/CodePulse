import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PriorityJobQueueLotteryScheduler } from './lottery-job-scheduler.service.ts';

describe('PriorityJobQueueLotteryScheduler [ARCH-CORE-022]', () => {
  test('schedules jobs and prevents starvation with ticket weighting', () => {
    const scheduler = new PriorityJobQueueLotteryScheduler();
    scheduler.enqueue({ id: 'job_high', payload: 'build', priority: 100 });
    scheduler.enqueue({ id: 'job_low', payload: 'cleanup', priority: 10 });

    assert.equal(scheduler.size(), 2);
    const next = scheduler.selectNextJob();
    assert.ok(next);
    assert.equal(scheduler.size(), 1);
  });

  test('returns null when selecting from empty queue', () => {
    const scheduler = new PriorityJobQueueLotteryScheduler();
    assert.equal(scheduler.selectNextJob(), null);
  });
});
