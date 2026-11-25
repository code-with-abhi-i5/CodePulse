import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TenantCredentialVaultService } from './sec-auth-09.service.ts';

describe('TenantCredentialVaultService (SEC-AUTH-09)', () => {
  it('encrypts and decrypts tenant credentials using envelope encryption', () => {
    const vault = new TenantCredentialVaultService();
    const secret = 'aws-secret-access-token-xyz';

    const envelope = vault.encryptSecret(secret);
    assert.notStrictEqual(envelope.encryptedData, secret);
    assert.ok(envelope.encryptedDek.includes(':'));

    const decrypted = vault.decryptSecret(envelope.encryptedData, envelope.encryptedDek);
    assert.strictEqual(decrypted, secret);
  });
});
