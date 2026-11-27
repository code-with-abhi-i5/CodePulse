import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TanStackQueryRetryGovernorService } from './tanstack-query-retry-governor.service.ts';

describe('TanStackQueryRetryGovernorService [L2-ERROR-RETRY-OFFLINE-053]', () => {
  const governor = new TanStackQueryRetryGovernorService({ maxRetries: 3, baseDelayMs: 500 });

  test('permits retry for 500 server error and network failures', () => {
    assert.equal(governor.shouldRetry(0, { status: 500 }), true);
    assert.equal(governor.shouldRetry(1, { code: 'ECONNRESET' }), true);
  });

  test('aborts retry immediately for 404 and 401 errors', () => {
    assert.equal(governor.shouldRetry(0, { status: 404 }), false);
    assert.equal(governor.shouldRetry(0, { status: 401 }), false);
  });

  test('stops retrying when maxRetries threshold is reached', () => {
    assert.equal(governor.shouldRetry(3, { status: 503 }), false);
  });
});
