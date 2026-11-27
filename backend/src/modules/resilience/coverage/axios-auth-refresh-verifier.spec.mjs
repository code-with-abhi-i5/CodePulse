import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosAuthRefreshInterceptorVerifier } from './axios-auth-refresh-verifier.service.ts';

describe('AxiosAuthRefreshInterceptorVerifier [L2-ERROR-RETRY-OFFLINE-046]', () => {
  const verifier = new AxiosAuthRefreshInterceptorVerifier();

  test('deduplicates concurrent refresh calls into single in-flight promise', async () => {
    let callCount = 0;
    const mockRefresh = async () => {
      callCount++;
      return 'new_access_token_123';
    };

    const [t1, t2, t3] = await Promise.all([
      verifier.acquireToken(mockRefresh),
      verifier.acquireToken(mockRefresh),
      verifier.acquireToken(mockRefresh)
    ]);

    assert.equal(callCount, 1);
    assert.equal(t1, 'new_access_token_123');
    assert.equal(t2, 'new_access_token_123');
    assert.equal(t3, 'new_access_token_123');
  });
});
