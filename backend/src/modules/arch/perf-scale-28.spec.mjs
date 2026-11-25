import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MicroserviceKeepAlivePoolService } from './perf-scale-28.service.ts';

describe('MicroserviceKeepAlivePoolService (PERF-SCALE-28)', () => {
  it('reuses pooled sockets and measures reuse ratio', () => {
    const pool = new MicroserviceKeepAlivePoolService(10, 1000);
    const s1 = pool.acquireSocket('auth-service', 100);
    assert.strictEqual(s1.isReused, false);

    pool.releaseSocket('auth-service', s1.socketId, 200);

    const s2 = pool.acquireSocket('auth-service', 300);
    assert.strictEqual(s2.isReused, true);
    assert.strictEqual(s2.socketId, s1.socketId);
    assert.strictEqual(pool.getReuseRatio(), 50);
  });

  it('reaps idle sockets exceeding timeout window', () => {
    const pool = new MicroserviceKeepAlivePoolService(10, 500);
    pool.releaseSocket('api-svc', 'sock-1', 1000);

    const reaped = pool.reapIdleSockets(1600); // 600ms later
    assert.strictEqual(reaped, 1);

    const s = pool.acquireSocket('api-svc', 1700);
    assert.strictEqual(s.isReused, false);
  });
});
