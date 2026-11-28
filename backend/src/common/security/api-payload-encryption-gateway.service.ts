import crypto from 'node:crypto';
import { EncryptedApiPayload } from '../../types/security';

export class ApiPayloadEncryptionGatewayService {
  public encryptPayload(payload: Record<string, unknown>, recipientPublicKeyHex: string): EncryptedApiPayload {
    const senderEcdh = crypto.createECDH('prime256v1');
    senderEcdh.generateKeys();

    const sharedSecret = senderEcdh.computeSecret(Buffer.from(recipientPublicKeyHex, 'hex'));
    const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let ciphertext = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');

    return {
      ephemeralPublicKey: senderEcdh.getPublicKey('hex'),
      iv: iv.toString('base64'),
      ciphertext,
      authTag
    };
  }

  public decryptPayload(encrypted: EncryptedApiPayload, recipientPrivateKeyEcdh: crypto.ECDH): Record<string, unknown> {
    const sharedSecret = recipientPrivateKeyEcdh.computeSecret(Buffer.from(encrypted.ephemeralPublicKey, 'hex'));
    const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(encrypted.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}
