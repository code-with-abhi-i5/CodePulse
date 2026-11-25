import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ColumnLevelEncryptionProviderService } from './db-data-21.service.ts';

describe('ColumnLevelEncryptionProviderService (DB-DATA-21)', () => {
  it('encrypts and decrypts sensitive column data using authenticated AES-256-GCM', () => {
    const provider = new ColumnLevelEncryptionProviderService();
    const secret = 'user-social-security-or-pii-token';

    const encrypted = provider.encrypt(secret);
    assert.notStrictEqual(encrypted, secret);
    assert.ok(encrypted.includes(':'));

    const decrypted = provider.decrypt(encrypted);
    assert.strictEqual(decrypted, secret);
  });
});
