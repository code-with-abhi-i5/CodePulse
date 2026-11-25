import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KmsEncryptedBackupManagerService } from './sec-auth-48.service.ts';

describe('KmsEncryptedBackupManagerService (SEC-AUTH-48)', () => {
  it('encrypts database backups using envelope encryption and verifies decryption integrity', () => {
    const manager = new KmsEncryptedBackupManagerService();
    const sqlDump = 'CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(255)); INSERT INTO users VALUES (1, "alice");';

    const pkg = manager.encryptBackup(sqlDump);
    assert.ok(pkg.encryptedData);
    assert.ok(pkg.encryptedDek);

    const decrypted = manager.verifyAndDecryptBackup(pkg);
    assert.strictEqual(decrypted.verified, true);
    assert.strictEqual(decrypted.decryptedSql, sqlDump);
  });

  it('fails decryption verification if payload or auth tag is corrupted', () => {
    const manager = new KmsEncryptedBackupManagerService();
    const pkg = manager.encryptBackup('DUMP');
    pkg.authTag = '00'.repeat(16); // corrupted auth tag

    const res = manager.verifyAndDecryptBackup(pkg);
    assert.strictEqual(res.verified, false);
  });
});
