/**
 * Architecture Service: Tenant-Scoped Credential Vault (Envelope Encryption)
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-09]
 */

import crypto from 'node:crypto';

export class TenantCredentialVaultService {
  private masterKey: Buffer;

  constructor(masterHexKey: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    this.masterKey = Buffer.from(masterHexKey, 'hex');
  }

  public encryptSecret(plaintext: string): { encryptedData: string; encryptedDek: string } {
    // Generate unique random Data Encryption Key (DEK)
    const dek = crypto.randomBytes(32);

    // Encrypt plaintext with DEK
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const encryptedData = `${iv.toString('hex')}:${authTag}:${ciphertext}`;

    // Encrypt DEK with Master Key (KEK)
    const kekIv = crypto.randomBytes(12);
    const kekCipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, kekIv);
    let encryptedDekHex = kekCipher.update(dek.toString('hex'), 'utf8', 'hex');
    encryptedDekHex += kekCipher.final('hex');
    const kekAuthTag = kekCipher.getAuthTag().toString('hex');

    const encryptedDek = `${kekIv.toString('hex')}:${kekAuthTag}:${encryptedDekHex}`;

    return { encryptedData, encryptedDek };
  }

  public decryptSecret(encryptedData: string, encryptedDek: string): string {
    // Decrypt DEK with Master Key
    const [kekIvHex, kekTagHex, encDekHex] = encryptedDek.split(':');
    const kekDecipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, Buffer.from(kekIvHex, 'hex'));
    kekDecipher.setAuthTag(Buffer.from(kekTagHex, 'hex'));
    let dekHex = kekDecipher.update(encDekHex, 'hex', 'utf8');
    dekHex += kekDecipher.final('utf8');

    const dek = Buffer.from(dekHex, 'hex');

    // Decrypt data with DEK
    const [ivHex, tagHex, dataHex] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
