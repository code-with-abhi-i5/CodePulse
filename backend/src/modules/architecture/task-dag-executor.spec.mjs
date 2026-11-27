import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TaskDagWorkflowExecutorService } from './task-dag-executor.service.ts';

describe('TaskDagWorkflowExecutorService [ARCH-CORE-031]', () => {
  const executor = new TaskDagWorkflowExecutorService();

  test('detects cycles in interdependent tasks', () => {
    const tasks = [
      { id: 'A', dependencies: ['B'], execute: () => 1 },
      { id: 'B', dependencies: ['A'], execute: () => 2 }
    ];
    const validation = executor.validateAcyclic(tasks);
    assert.equal(validation.valid, false);
    assert.ok(validation.cycle?.includes('A'));
  });

  test('executes acyclic workflow stages respecting dependency ordering', async () => {
    const trace = [];
    const tasks = [
      { id: 'stage_compile', dependencies: [], execute: () => { trace.push('compile'); return true; } },
      { id: 'stage_test', dependencies: ['stage_compile'], execute: () => { trace.push('test'); return true; } },
      { id: 'stage_lint', dependencies: ['stage_compile'], execute: () => { trace.push('lint'); return true; } },
      { id: 'stage_package', dependencies: ['stage_test', 'stage_lint'], execute: () => { trace.push('package'); return true; } }
    ];

    const reports = await executor.executeDag(tasks);
    assert.equal(reports.get('stage_package')?.status, 'COMPLETED');
    assert.equal(trace[0], 'compile');
    assert.equal(trace[trace.length - 1], 'package');
  });

  test('skips downstream tasks when upstream dependency fails', async () => {
    const tasks = [
      { id: 'step_fail', dependencies: [], execute: () => { throw new Error('Build error'); } },
      { id: 'step_dependent', dependencies: ['step_fail'], execute: () => 'should not run' }
    ];

    const reports = await executor.executeDag(tasks);
    assert.equal(reports.get('step_fail')?.status, 'FAILED');
    assert.equal(reports.get('step_dependent')?.status, 'SKIPPED');
  });
});
