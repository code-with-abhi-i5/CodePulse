import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiBatchExecutionService } from './api-int-25.service.ts';

describe('ApiBatchExecutionService (API-INT-25)', () => {
  it('executes batch requests concurrently and collects structured responses', async () => {
    const service = new ApiBatchExecutionService(10);
    const mockDispatcher = async (req) => {
      if (req.path === '/challenges/1') return { status: 200, body: { id: 1 } };
      if (req.path === '/challenges/2') return { status: 200, body: { id: 2 } };
      return { status: 404, body: { error: 'Not found' } };
    };

    const results = await service.executeBatch([
      { id: 'req-1', method: 'GET', path: '/challenges/1' },
      { id: 'req-2', method: 'GET', path: '/challenges/2' }
    ], mockDispatcher);

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].status, 200);
    assert.strictEqual(results[1].status, 200);
  });
});
