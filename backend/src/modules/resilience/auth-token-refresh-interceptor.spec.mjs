import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AuthTokenRefreshInterceptorService } from './auth-token-refresh-interceptor.service.ts';

describe('AuthTokenRefreshInterceptorService [L2-ERROR-RETRY-OFFLINE-056]', () => {
  test('coordinates token refresh and retries queued requests', async () => {
    const interceptor = new AuthTokenRefreshInterceptorService();
    const retriedTokens = [];

    interceptor.enqueueRequest({
      id: 'req1',
      retry: async token => { retriedTokens.push(token); }
    });

    const res = await interceptor.handle401Error(async () => 'jwt_refreshed_999');
    assert.equal(res.refreshed, true);
    assert.equal(res.newToken, 'jwt_refreshed_999');
    assert.deepEqual(retriedTokens, ['jwt_refreshed_999']);
  });

  test('handles refresh failure gracefully clearing queue', async () => {
    const interceptor = new AuthTokenRefreshInterceptorService();
    interceptor.enqueueRequest({ id: 'r2', retry: async () => {} });

    const res = await interceptor.handle401Error(async () => {
      throw new Error('Refresh token revoked');
    });

    assert.equal(res.refreshed, false);
    assert.equal(interceptor.getQueueLength(), 0);
    assert.ok(res.error?.includes('Refresh token revoked'));
  });
});
