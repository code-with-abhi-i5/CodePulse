/**
 * Architecture Service: KMS Encrypted Database Backups Manager
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-48]
 */

import crypto from 'node:crypto';

export interface EncryptedBackupPackage {
  encryptedData: string; // base64
  encryptedDek: string;  // base64
  iv: string;            // hex
  authTag: string;       // hex
  sha256Checksum: string;
}

export class KmsEncryptedBackupManagerService {
  private kmsMasterKey: Buffer;

  constructor(kmsMasterKeyHex: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    this.kmsMasterKey = Buffer.from(kmsMasterKeyHex, 'hex');
  }

  public encryptBackup(plainSqlPayload: string): EncryptedBackupPackage {
    // 1. Generate unique DEK
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // 2. Encrypt plaintext payload with DEK using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    const encryptedData = Buffer.concat([cipher.update(plainSqlPayload, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 3. Encrypt DEK with KMS Master Key (AES-256-ECB / wrap)
    const dekCipher = crypto.createCipheriv('aes-256-ecb', this.kmsMasterKey, null);
    const encryptedDek = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);

    const sha256Checksum = crypto.createHash('sha256').update(plainSqlPayload).digest('hex');

    return {
      encryptedData: encryptedData.toString('base64'),
      encryptedDek: encryptedDek.toString('base64'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      sha256Checksum
    };
  }

  public verifyAndDecryptBackup(pkg: EncryptedBackupPackage): { verified: boolean; decryptedSql?: string; error?: string } {
    try {
      // 1. Decrypt DEK using KMS Master Key
      const dekDecipher = crypto.createDecipheriv('aes-256-ecb', this.kmsMasterKey, null);
      const dek = Buffer.concat([dekDecipher.update(Buffer.from(pkg.encryptedDek, 'base64')), dekDecipher.final()]);

      // 2. Decrypt data using DEK
      const decipher = crypto.createDecipheriv('aes-256-gcm', dek, Buffer.from(pkg.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(pkg.authTag, 'hex'));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(pkg.encryptedData, 'base64')), decipher.final()]);
      const decryptedSql = decrypted.toString('utf8');

      // 3. Verify Checksum
      const calcChecksum = crypto.createHash('sha256').update(decryptedSql).digest('hex');
      if (calcChecksum !== pkg.sha256Checksum) {
        return { verified: false, error: 'Checksum mismatch after decryption' };
      }

      return { verified: true, decryptedSql };
    } catch (err: any) {
      return { verified: false, error: err.message };
    }
  }
}
