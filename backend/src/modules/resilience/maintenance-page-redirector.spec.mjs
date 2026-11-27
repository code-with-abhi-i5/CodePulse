import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MaintenancePageRedirectorService } from './maintenance-page-redirector.service.ts';

describe('MaintenancePageRedirectorService [L2-ERROR-RETRY-OFFLINE-050]', () => {
  const service = new MaintenancePageRedirectorService();

  test('parses 503 maintenance status with Retry-After and redirect url', () => {
    const res = service.parseStatus(503, { 'retry-after': '120', 'x-maintenance-window': 'Database maintenance' });
    assert.equal(res.isMaintenance, true);
    assert.equal(res.retryAfterSec, 120);
    assert.equal(res.redirectUrl, '/maintenance?retry_after=120');
    assert.equal(res.maintenanceWindow, 'Database maintenance');
  });

  test('passes non-503 status code through without redirect', () => {
    const res = service.parseStatus(200);
    assert.equal(res.isMaintenance, false);
    assert.equal(res.redirectUrl, undefined);
  });
});
