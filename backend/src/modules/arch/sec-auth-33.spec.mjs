import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SecretScanningKeyRevokerService } from './sec-auth-33.service.ts';

describe('SecretScanningKeyRevokerService (SEC-AUTH-33)', () => {
  it('automatically revokes leaked tokens upon receiving GitHub Secret Scanning alert', () => {
    const revoker = new SecretScanningKeyRevokerService();
    const token = 'cp_live_1234567890abcdef1234567890abcdef';
    revoker.registerKey(token, 'key-alpha', 'tenant-1');

    assert.strictEqual(revoker.isKeyValid(token), true);

    const result = revoker.handleGitHubLeakAlert({
      token,
      type: 'codepulse_api_key',
      url: 'https://github.com/public-repo/commit/123',
      source: 'commit'
    });

    assert.strictEqual(result.wasRevoked, true);
    assert.strictEqual(revoker.isKeyValid(token), false);
  });
});
