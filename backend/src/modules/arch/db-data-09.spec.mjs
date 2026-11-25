import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaQueryTimeoutInterceptorService } from './db-data-09.service.ts';

describe('PrismaQueryTimeoutInterceptorService (DB-DATA-09)', () => {
  it('completes fast queries normally within timeout window', async () => {
    const interceptor = new PrismaQueryTimeoutInterceptorService(500);
    const result = await interceptor.executeWithTimeout('fastQuery', async () => 'data_loaded');
    assert.strictEqual(result, 'data_loaded');
  });

  it('aborts and cancels queries exceeding the timeout threshold', async () => {
    const interceptor = new PrismaQueryTimeoutInterceptorService(100);
    await assert.rejects(
      async () => {
        await interceptor.executeWithTimeout('slowTransaction', async (signal) => {
          return new Promise((resolve, reject) => {
            const id = setTimeout(() => resolve('done'), 300);
            signal.addEventListener('abort', () => {
              clearTimeout(id);
              reject(new Error('Aborted'));
            });
          });
        });
      },
      /Query execution timeout: 'slowTransaction'/
    );
  });
});
