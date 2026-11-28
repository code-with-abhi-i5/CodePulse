import crypto from 'node:crypto';
import { OAuthStatePayload } from '../../types/security';

export class OAuthStateEncryptorService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly encryptionKey: Buffer = crypto.scryptSync('oauth-secret-pass', 'salt', 32),
    private readonly ttlMs: number = 600000 // 10 minutes
  ) {}

  public encryptState(payload: OAuthStatePayload): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    const serialized = JSON.stringify(payload);
    let encrypted = cipher.update(serialized, 'utf8', 'base64url');
    encrypted += cipher.final('base64url');
    const authTag = cipher.getAuthTag().toString('base64url');

    return `${iv.toString('base64url')}.${encrypted}.${authTag}`;
  }

  public decryptState(encryptedToken: string, now: number = Date.now()): { valid: boolean; payload?: OAuthStatePayload; error?: string } {
    const parts = encryptedToken.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed state token format' };
    }

    try {
      const iv = Buffer.from(parts[0], 'base64url');
      const ciphertext = parts[1];
      const authTag = Buffer.from(parts[2], 'base64url');

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext, 'base64url', 'utf8');
      decrypted += decipher.final('utf8');

      const payload = JSON.parse(decrypted) as OAuthStatePayload;
      if (now - payload.issuedAt > this.ttlMs) {
        return { valid: false, error: 'OAuth state token has expired' };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Decryption failed or invalid integrity tag' };
    }
  }
}
