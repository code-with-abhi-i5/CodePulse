import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Http503MaintenanceInterceptorService } from './http503-maintenance-interceptor.service.ts';

describe('Http503MaintenanceInterceptorService [L2-ERROR-RETRY-OFFLINE-060]', () => {
  const interceptor = new Http503MaintenanceInterceptorService();

  test('detects HTTP 503 and formats redirect URL with Retry-After header', () => {
    const res = interceptor.interceptResponse(503, { 'retry-after': '60' });
    assert.equal(res.isMaintenance, true);
    assert.equal(res.retryAfterSeconds, 60);
    assert.equal(res.redirectUrl, '/maintenance?retry_after=60');
  });

  test('falls back to default retry after window when header is omitted', () => {
    const res = interceptor.interceptResponse(503);
    assert.equal(res.isMaintenance, true);
    assert.equal(res.retryAfterSeconds, 300);
    assert.equal(res.redirectUrl, '/maintenance?retry_after=300');
  });

  test('ignores non-503 status codes passing through untouched', () => {
    const res = interceptor.interceptResponse(200);
    assert.equal(res.isMaintenance, false);
    assert.equal(res.redirectUrl, undefined);
  });
});
