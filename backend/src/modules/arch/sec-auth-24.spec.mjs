import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TenantExportEncryptionService } from './sec-auth-24.service.ts';

describe('TenantExportEncryptionService (SEC-AUTH-24)', () => {
  it('validates PGP key format and generates encrypted compliance package with checksum', () => {
    const service = new TenantExportEncryptionService();
    const fakePgpKey = '-----BEGIN PGP PUBLIC KEY BLOCK-----\n' + 'A'.repeat(250) + '\n-----END PGP PUBLIC KEY BLOCK-----';

    const result = service.packageEncryptedExport('{"user_id":123,"logs":["event1"]}', fakePgpKey);
    assert.ok(result.encryptedPayload.includes('BEGIN PGP MESSAGE'));
    assert.ok(result.checksum.length === 64);
  });
});
