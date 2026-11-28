import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

class ApiPayloadEncryptionGatewayService {
  encryptPayload(payload, recipientPublicKeyHex) {
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

  decryptPayload(encrypted, recipientPrivateKeyEcdh) {
    const sharedSecret = recipientPrivateKeyEcdh.computeSecret(Buffer.from(encrypted.ephemeralPublicKey, 'hex'));
    const aesKey = crypto.createHash('sha256').update(sharedSecret).digest();

    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(encrypted.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

describe('ApiPayloadEncryptionGatewayService', () => {
  const gateway = new ApiPayloadEncryptionGatewayService();

  it('encrypts and decrypts payloads via ECDH key agreement and AES-256-GCM', () => {
    const recipientEcdh = crypto.createECDH('prime256v1');
    recipientEcdh.generateKeys();
    const recipientPubKey = recipientEcdh.getPublicKey('hex');

    const data = { secretMessage: 'TopSecretTournamentStrategy', timestamp: 12345 };
    const encrypted = gateway.encryptPayload(data, recipientPubKey);

    assert.ok(encrypted.ciphertext);
    assert.ok(encrypted.authTag);

    const decrypted = gateway.decryptPayload(encrypted, recipientEcdh);
    assert.deepEqual(decrypted, data);
  });
});
