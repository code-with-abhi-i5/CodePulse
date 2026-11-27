import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DistributedSagaOrchestrator } from './distributed-saga-orchestrator.service.ts';

describe('DistributedSagaOrchestrator [ARCH-CORE-003]', () => {
  const orchestrator = new DistributedSagaOrchestrator();

  test('completes all steps cleanly in successful saga', async () => {
    const trace = [];
    const steps = [
      { name: 'reserveSeats', forward: () => trace.push('seats'), compensate: () => trace.push('unseats') },
      { name: 'chargeCard', forward: () => trace.push('charge'), compensate: () => trace.push('refund') }
    ];

    const result = await orchestrator.executeSaga(steps);
    assert.equal(result.state, 'COMPLETED');
    assert.deepEqual(trace, ['seats', 'charge']);
  });

  test('executes compensatory actions in reverse order upon step failure', async () => {
    const trace = [];
    const steps = [
      { name: 'step1', forward: () => trace.push('step1_fwd'), compensate: () => trace.push('step1_comp') },
      { name: 'step2', forward: () => { throw new Error('Payment declined'); }, compensate: () => trace.push('step2_comp') }
    ];

    const result = await orchestrator.executeSaga(steps);
    assert.equal(result.state, 'COMPENSATED');
    assert.ok(result.error?.includes('Payment declined'));
    assert.deepEqual(trace, ['step1_fwd', 'step1_comp']);
  });
});
