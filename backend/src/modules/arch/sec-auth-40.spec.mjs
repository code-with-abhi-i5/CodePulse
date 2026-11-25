import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GdprCryptoShreddingService } from './sec-auth-40.service.ts';

describe('GdprCryptoShreddingService (SEC-AUTH-40)', () => {
  it('cryptographically shreds tenant encryption keys rendering encrypted datasets permanently unrecoverable', () => {
    const shredder = new GdprCryptoShreddingService();
    const key = Buffer.from('0123456789abcdef0123456789abcdef');
    shredder.registerTenantKey('tenant-delete-me', key);

    assert.strictEqual(shredder.hasActiveKey('tenant-delete-me'), true);

    const shredded = shredder.cryptoShredTenant('tenant-delete-me');
    assert.strictEqual(shredded, true);
    assert.strictEqual(shredder.hasActiveKey('tenant-delete-me'), false);
    // Key buffer in memory is zeroed
    assert.strictEqual(key[0], 0);
  });
});
