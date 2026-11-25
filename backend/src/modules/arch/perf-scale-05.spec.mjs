import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CompilerWorkerThreadPoolService } from './perf-scale-05.service.ts';

describe('CompilerWorkerThreadPoolService (PERF-SCALE-05)', () => {
  it('dispatches tasks up to max concurrency and queues surplus tasks', () => {
    const pool = new CompilerWorkerThreadPoolService(2);
    const r1 = pool.submitTask({ id: 't1', code: '', language: 'cpp', priority: 'normal' });
    assert.strictEqual(r1.status, 'dispatched');

    const r2 = pool.submitTask({ id: 't2', code: '', language: 'rust', priority: 'normal' });
    assert.strictEqual(r2.status, 'dispatched');

    const r3 = pool.submitTask({ id: 't3', code: '', language: 'go', priority: 'normal' });
    assert.strictEqual(r3.status, 'queued');

    const stats = pool.getPoolStats();
    assert.strictEqual(stats.activeWorkers, 2);
    assert.strictEqual(stats.queueDepth, 1);
  });

  it('promotes high-priority tasks to front of queue and assigns idle workers', () => {
    const pool = new CompilerWorkerThreadPoolService(1);
    pool.submitTask({ id: 'normal-1', code: '', language: 'c', priority: 'normal' });
    pool.submitTask({ id: 'normal-2', code: '', language: 'c', priority: 'normal' });
    pool.submitTask({ id: 'urgent-1', code: '', language: 'c', priority: 'high' });

    const next = pool.onWorkerComplete();
    assert.strictEqual(next?.id, 'urgent-1');
  });
});
