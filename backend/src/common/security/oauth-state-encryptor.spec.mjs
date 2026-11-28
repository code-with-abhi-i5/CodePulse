import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class OAuthStateEncryptorService {
  constructor(
    encryptionKey = crypto.scryptSync('oauth-secret-pass', 'salt', 32),
    ttlMs = 600000
  ) {
    this.encryptionKey = encryptionKey;
    this.ttlMs = ttlMs;
    this.algorithm = 'aes-256-gcm';
  }

  encryptState(payload) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    const serialized = JSON.stringify(payload);
    let encrypted = cipher.update(serialized, 'utf8', 'base64url');
    encrypted += cipher.final('base64url');
    const authTag = cipher.getAuthTag().toString('base64url');

    return iv.toString('base64url') + '.' + encrypted + '.' + authTag;
  }

  decryptState(encryptedToken, now = Date.now()) {
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

      const payload = JSON.parse(decrypted);
      if (now - payload.issuedAt > this.ttlMs) {
        return { valid: false, error: 'OAuth state token has expired' };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, error: 'Decryption failed or invalid integrity tag' };
    }
  }
}

describe('OAuthStateEncryptorService', () => {
  const encryptor = new OAuthStateEncryptorService();

  it('encrypts and decrypts state payload using authenticated AES-256-GCM', () => {
    const payload = {
      csrfToken: 'csrf_12345',
      sessionId: 'sess_abc',
      redirectUri: '/profile',
      issuedAt: 10000
    };

    const token = encryptor.encryptState(payload);
    assert.equal(token.split('.').length, 3);

    const result = encryptor.decryptState(token, 15000);
    assert.equal(result.valid, true);
    assert.equal(result.payload.csrfToken, 'csrf_12345');
    assert.equal(result.payload.redirectUri, '/profile');
  });

  it('detects tampering and rejects expired state tokens', () => {
    const payload = { csrfToken: 'c1', sessionId: 's1', redirectUri: '/', issuedAt: 1000 };
    const token = encryptor.encryptState(payload);

    const expiredResult = encryptor.decryptState(token, 700000);
    assert.equal(expiredResult.valid, false);
    assert.ok(expiredResult.error.includes('expired'));

    const tampered = token.slice(0, -4) + 'AAAA';
    const tamperedResult = encryptor.decryptState(tampered, 2000);
    assert.equal(tamperedResult.valid, false);
    assert.ok(tamperedResult.error.includes('Decryption failed'));
  });
});
