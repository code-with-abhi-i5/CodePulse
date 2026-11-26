import { EncryptedColumnPayload } from '../../types/db';

export class ColumnEncryptionTransformerService {
  private readonly prefix = 'enc:v1:';

  encrypt(plainText: string): EncryptedColumnPayload {
    if (!plainText) return { cipherText: '', algorithm: 'none', isEncrypted: false };
    const b64 = Buffer.from(plainText, 'utf8').toString('base64');
    return {
      cipherText: this.prefix + b64,
      algorithm: 'aes-256-gcm-mock',
      isEncrypted: true
    };
  }

  decrypt(cipherText: string): string {
    if (!cipherText || !cipherText.startsWith(this.prefix)) return cipherText;
    const rawB64 = cipherText.slice(this.prefix.length);
    return Buffer.from(rawB64, 'base64').toString('utf8');
  }
}
