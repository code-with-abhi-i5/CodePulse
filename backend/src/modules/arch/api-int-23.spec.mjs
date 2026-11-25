import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ApiKeyScopedTokenManagerService } from './api-int-23.service.ts';

describe('ApiKeyScopedTokenManagerService (API-INT-23)', () => {
  it('generates prefixed API keys and validates cryptographic secrets and scopes', () => {
    const manager = new ApiKeyScopedTokenManagerService();
    const { plaintext, prefix } = manager.generateKey('tenant-42', ['read:challenges', 'write:submissions']);

    assert.strictEqual(prefix.startsWith('cp_live_'), true);
    assert.strictEqual(manager.validateKey(plaintext, 'read:challenges').valid, true);
    assert.strictEqual(manager.validateKey(plaintext, 'admin:delete').valid, false);
    assert.strictEqual(manager.validateKey('cp_live_fake_wrongsecret').valid, false);
  });
});
