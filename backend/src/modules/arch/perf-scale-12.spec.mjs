import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AstNodeObjectPoolService } from './perf-scale-12.service.ts';

describe('AstNodeObjectPoolService (PERF-SCALE-12)', () => {
  it('acquires new node and reuses released node without reallocation', () => {
    const pool = new AstNodeObjectPoolService();
    const node1 = pool.acquire('Identifier', 'myVar', 42);
    assert.strictEqual(node1.name, 'myVar');
    assert.strictEqual(pool.getStats().totalAllocated, 1);

    pool.release(node1);
    assert.strictEqual(pool.getStats().poolSize, 1);

    const node2 = pool.acquire('Literal', 'pi', 3.14);
    assert.strictEqual(node2.id, node1.id); // Same object instance reused
    assert.strictEqual(node2.name, 'pi');
    assert.strictEqual(pool.getStats().totalReused, 1);
    assert.strictEqual(pool.getStats().totalAllocated, 1);
  });
});
