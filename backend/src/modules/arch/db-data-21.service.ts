/**
 * Architecture Service: Column-Level Encryption-at-Rest Provider
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-21]
 */

import crypto from 'node:crypto';

export class ColumnLevelEncryptionProviderService {
  private key: Buffer;

  constructor(hexKey32Bytes: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef') {
    this.key = Buffer.from(hexKey32Bytes, 'hex');
  }

  public encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  public decrypt(cipherPayload: string): string {
    const parts = cipherPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid cipher payload format; expected iv:authTag:encryptedData');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
