import test from 'node:test';
import assert from 'node:assert/strict';
import { MaintenanceRedirectInterceptor } from './maintenance-redirect-interceptor.service.ts';

test('MaintenanceRedirectInterceptor [L2-ERROR-RETRY-OFFLINE-010]', async (t) => {
  await t.test('intercepts 503 and returns redirect URL except for health and maintenance pages', () => {
    const interceptor = new MaintenanceRedirectInterceptor();
    assert.equal(interceptor.shouldRedirect(503, '/api/challenges'), true);
    assert.equal(interceptor.shouldRedirect(503, '/api/health'), false);
    assert.equal(interceptor.shouldRedirect(503, '/maintenance'), false);
    assert.equal(interceptor.shouldRedirect(200, '/api/challenges'), false);
    assert.equal(interceptor.getRedirectUrl(), '/maintenance');
  });
});
