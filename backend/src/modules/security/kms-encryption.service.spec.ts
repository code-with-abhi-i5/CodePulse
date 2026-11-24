import {
  KmsEncryptionService,
  EncryptedEnvelope,
  KmsTamperDetectedException,
  KmsMasterKeyNotFoundException,
} from './kms-encryption.service';
import * as crypto from 'crypto';

describe('KmsEncryptionService (Envelope Encryption Architecture #391)', () => {
  let kmsService: KmsEncryptionService;

  beforeEach(() => {
    kmsService = new KmsEncryptionService();
  });

  describe('Core Envelope Encryption & Decryption', () => {
    it('encrypts a GitHub OAuth token using an individual DEK and decrypts accurately', () => {
      const originalToken = 'gho_16C7e42F292c6912E7710c838347Ae178B4a';
      const envelope = kmsService.encryptEnvelope(originalToken);

      expect(envelope).toBeDefined();
      expect(envelope.version).toBe(1);
      expect(envelope.algorithm).toBe('AES-256-GCM');
      expect(envelope.keyId).toBe(kmsService.getPrimaryKeyId());
      expect(envelope.ciphertext).toBeDefined();
      expect(envelope.ciphertext).not.toBe(originalToken);
      expect(envelope.encryptedDek).toBeDefined();
      expect(envelope.iv).toBeDefined();
      expect(envelope.authTag).toBeDefined();

      const decrypted = kmsService.decryptEnvelope(envelope);
      expect(decrypted).toBe(originalToken);
    });

    it('generates a unique Data Encryption Key (DEK) and unique IV for every single encryption', () => {
      const token = 'gho_static_test_token_1234567890';

      const env1 = kmsService.encryptEnvelope(token);
      const env2 = kmsService.encryptEnvelope(token);

      // Ciphertexts, DEKs, and IVs must be completely distinct due to random keys and IVs
      expect(env1.encryptedDek).not.toBe(env2.encryptedDek);
      expect(env1.iv).not.toBe(env2.iv);
      expect(env1.ciphertext).not.toBe(env2.ciphertext);

      // Both must decrypt to the exact same original token
      expect(kmsService.decryptEnvelope(env1)).toBe(token);
      expect(kmsService.decryptEnvelope(env2)).toBe(token);
    });

    it('destroys plaintext DEK from memory immediately after encryption', () => {
      // Spy on Buffer.prototype.fill to verify DEK memory sanitization
      const fillSpy = jest.spyOn(Buffer.prototype, 'fill');

      const token = 'ghp_ephemeral_token_memory_cleanup_check';
      const envelope = kmsService.encryptEnvelope(token);

      expect(envelope).toBeDefined();
      // fill(0) should be called to wipe the DEK buffer
      expect(fillSpy).toHaveBeenCalledWith(0);

      fillSpy.mockClear();
      kmsService.decryptEnvelope(envelope);
      expect(fillSpy).toHaveBeenCalledWith(0);

      fillSpy.mockRestore();
    });
  });

  describe('Tamper Detection & Authenticated Encryption (AES-GCM)', () => {
    it('detects and rejects tampered ciphertext payloads', () => {
      const token = 'gho_secret_access_token_tamper_check';
      const envelope = kmsService.encryptEnvelope(token);

      // Tamper by modifying one character in the base64 ciphertext
      const buffer = Buffer.from(envelope.ciphertext, 'base64');
      buffer[0] ^= 0xff; // Flip bits
      const tamperedEnvelope: EncryptedEnvelope = {
        ...envelope,
        ciphertext: buffer.toString('base64'),
      };

      expect(() => kmsService.decryptEnvelope(tamperedEnvelope)).toThrow(
        KmsTamperDetectedException
      );
    });

    it('detects and rejects tampered authentication tags', () => {
      const token = 'gho_secret_token_auth_tag_check';
      const envelope = kmsService.encryptEnvelope(token);

      // Corrupt auth tag
      const authTagBuffer = Buffer.from(envelope.authTag, 'base64');
      authTagBuffer[1] ^= 0xff;
      const tamperedEnvelope: EncryptedEnvelope = {
        ...envelope,
        authTag: authTagBuffer.toString('base64'),
      };

      expect(() => kmsService.decryptEnvelope(tamperedEnvelope)).toThrow(
        KmsTamperDetectedException
      );
    });

    it('detects and rejects tampered initialization vectors (IV)', () => {
      const token = 'gho_secret_token_iv_check';
      const envelope = kmsService.encryptEnvelope(token);

      const ivBuffer = Buffer.from(envelope.iv, 'base64');
      ivBuffer[0] ^= 0xaa;
      const tamperedEnvelope: EncryptedEnvelope = {
        ...envelope,
        iv: ivBuffer.toString('base64'),
      };

      expect(() => kmsService.decryptEnvelope(tamperedEnvelope)).toThrow(
        KmsTamperDetectedException
      );
    });

    it('detects and rejects tampered encrypted DEKs', () => {
      const token = 'gho_secret_token_dek_check';
      const envelope = kmsService.encryptEnvelope(token);

      const dekBuffer = Buffer.from(envelope.encryptedDek, 'base64');
      dekBuffer[2] ^= 0x55;
      const tamperedEnvelope: EncryptedEnvelope = {
        ...envelope,
        encryptedDek: dekBuffer.toString('base64'),
      };

      expect(() => kmsService.decryptEnvelope(tamperedEnvelope)).toThrow(
        KmsTamperDetectedException
      );
    });

    it('enforces Associated Authenticated Data (AAD) integrity', () => {
      const token = 'gho_token_with_user_aad';
      const userId = 'user-uuid-12345';

      const envelope = kmsService.encryptEnvelope(token, undefined, userId);
      // Decryption with correct AAD succeeds
      expect(kmsService.decryptEnvelope(envelope, userId)).toBe(token);

      // Decryption with missing or mismatched AAD fails authentication
      expect(() => kmsService.decryptEnvelope(envelope, 'wrong-user-id')).toThrow(
        KmsTamperDetectedException
      );
      expect(() => kmsService.decryptEnvelope(envelope)).toThrow(
        KmsTamperDetectedException
      );
    });
  });

  describe('Key Rotation Architecture', () => {
    it('re-encrypts stored DEK under a new Master KMS key without modifying ciphertext', () => {
      const originalToken = 'gho_token_to_reencrypt_under_new_kms_key';
      const initialEnvelope = kmsService.encryptEnvelope(originalToken);

      const oldKeyId = initialEnvelope.keyId;
      const newKeyId = 'arn:aws:kms:us-east-1:123456789012:key/codepulse-master-2027';

      // 1. Rotate Master Key in KMS registry
      kmsService.rotateMasterKey(newKeyId);
      expect(kmsService.getPrimaryKeyId()).toBe(newKeyId);

      // 2. Re-encrypt the existing envelope under the new master key
      const reencrypted = kmsService.reencryptEnvelope(initialEnvelope, newKeyId);

      // DEK and KeyId are updated
      expect(reencrypted.keyId).toBe(newKeyId);
      expect(reencrypted.encryptedDek).not.toBe(initialEnvelope.encryptedDek);

      // CRITICAL ENVELOPE INVARIANT: Data ciphertext, payload IV, and authTag MUST remain unchanged!
      expect(reencrypted.ciphertext).toBe(initialEnvelope.ciphertext);
      expect(reencrypted.iv).toBe(initialEnvelope.iv);
      expect(reencrypted.authTag).toBe(initialEnvelope.authTag);

      // Successfully decrypts under the new Master Key
      const decrypted = kmsService.decryptEnvelope(reencrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('successfully handles multiple generations of rotated keys', () => {
      const token = 'gho_multi_rotation_token';
      const keyV1 = kmsService.getPrimaryKeyId();
      const envV1 = kmsService.encryptEnvelope(token, keyV1);

      const keyV2 = 'kms-key-v2';
      kmsService.rotateMasterKey(keyV2);
      const envV2 = kmsService.reencryptEnvelope(envV1, keyV2);

      const keyV3 = 'kms-key-v3';
      kmsService.rotateMasterKey(keyV3);
      const envV3 = kmsService.reencryptEnvelope(envV2, keyV3);

      expect(envV3.keyId).toBe(keyV3);
      expect(kmsService.decryptEnvelope(envV3)).toBe(token);
      // Older envelopes still decryptable via key history in KMS
      expect(kmsService.decryptEnvelope(envV1)).toBe(token);
    });
  });

  describe('Database Leak Security Guarantee', () => {
    it('demonstrates that a database dump alone cannot decrypt credentials without KMS access', () => {
      const sensitiveToken = 'ghp_super_secret_github_personal_token';
      const envelope = kmsService.encryptEnvelope(sensitiveToken);

      // Attacker has compromised the DB dump containing all stored columns
      const dbDumpRow = {
        ciphertext: envelope.ciphertext,
        encryptedDek: envelope.encryptedDek,
        iv: envelope.iv,
        authTag: envelope.authTag,
        dekIv: envelope.dekIv,
        dekAuthTag: envelope.dekAuthTag,
        keyId: envelope.keyId,
        algorithm: envelope.algorithm,
        version: envelope.version,
        createdAt: envelope.createdAt,
      };

      // Attacker sets up a rogue instance without the Master KMS Key
      const rogueKms = new KmsEncryptionService();
      // Remove all master keys from rogue instance
      (rogueKms as any).masterKeys.clear();

      expect(() => rogueKms.decryptEnvelope(dbDumpRow)).toThrow(
        KmsMasterKeyNotFoundException
      );
    });
  });

  describe('Compact String Serialization Format', () => {
    it('serializes and deserializes transport-safe enc:v1 string format', () => {
      const token = 'gho_serializable_token_test';
      const serialized = kmsService.encryptToken(token);

      expect(serialized).toMatch(/^enc:v1:[A-Za-z0-9_-]+$/);
      expect(kmsService.isEnvelope(serialized)).toBe(true);

      const decrypted = kmsService.decryptToken(serialized);
      expect(decrypted).toBe(token);
    });

    it('rejects invalid or malformed serialized strings', () => {
      expect(() => kmsService.deserialize('invalid:prefix:xyz')).toThrow();
      expect(() => kmsService.deserialize('enc:v1:not-valid-json')).toThrow();
      expect(kmsService.isEnvelope('plaintext_token')).toBe(false);
    });

    it('re-encrypts serialized token strings during key rotation', () => {
      const token = 'gho_serialized_rotation';
      const serializedV1 = kmsService.encryptToken(token);

      const keyV2 = 'kms-key-rotated-2027';
      kmsService.rotateMasterKey(keyV2);

      const serializedV2 = kmsService.reencryptToken(serializedV1, keyV2);
      expect(serializedV2).not.toBe(serializedV1);
      expect(kmsService.decryptToken(serializedV2)).toBe(token);
    });
  });
});
