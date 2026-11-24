import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface EncryptedEnvelope {
  version: number;
  algorithm: 'AES-256-GCM';
  keyId: string;
  encryptedDek: string;    // Base64-encoded DEK encrypted under Master KMS Key
  dekIv: string;           // Base64-encoded 12-byte IV used to encrypt DEK
  dekAuthTag: string;      // Base64-encoded 16-byte GCM authentication tag for DEK
  iv: string;              // Base64-encoded 12-byte IV used to encrypt plaintext data
  authTag: string;         // Base64-encoded 16-byte GCM authentication tag for data
  ciphertext: string;      // Base64-encoded encrypted plaintext data
  createdAt: number;
}

export interface MasterKeyMetadata {
  keyId: string;
  key: Buffer;
  status: 'ACTIVE' | 'ROTATED' | 'DISABLED';
  createdAt: number;
}

export class KmsTamperDetectedException extends BadRequestException {
  constructor(message = 'Cryptographic tamper detected: AES-GCM authentication verification failed') {
    super(message);
    this.name = 'KmsTamperDetectedException';
  }
}

export class KmsMasterKeyNotFoundException extends BadRequestException {
  constructor(keyId: string) {
    super(`Master KMS Key '${keyId}' not found in key registry`);
    this.name = 'KmsMasterKeyNotFoundException';
  }
}

@Injectable()
export class KmsEncryptionService {
  private readonly logger = new Logger(KmsEncryptionService.name);

  // Envelope specification version
  public static readonly ENVELOPE_VERSION = 1;
  public static readonly ALGORITHM = 'aes-256-gcm';
  public static readonly IV_LENGTH = 12; // 96-bit standard IV for GCM
  public static readonly DEK_LENGTH = 32; // 256-bit key for AES-256
  public static readonly AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

  // Master KMS Key registry simulating AWS KMS / GCP KMS / HashiCorp Vault
  private readonly masterKeys = new Map<string, MasterKeyMetadata>();
  private primaryKeyId = 'arn:aws:kms:us-east-1:123456789012:key/codepulse-master-2026';

  constructor() {
    this.initializeDefaultMasterKey();
  }

  private initializeDefaultMasterKey(): void {
    const rawSecret =
      process.env.KMS_MASTER_KEY ||
      'codepulse-enterprise-master-kms-key-secret-seed-32-bytes-long!';
    const derivedKey = crypto.createHash('sha256').update(rawSecret).digest();

    this.masterKeys.set(this.primaryKeyId, {
      keyId: this.primaryKeyId,
      key: derivedKey,
      status: 'ACTIVE',
      createdAt: Date.now(),
    });

    this.logger.log(`Initialized KMS Envelope Encryption with Primary Key: ${this.primaryKeyId}`);
  }

  /**
   * Registers a new Master Key in the KMS key store (e.g. during rotation).
   */
  public registerMasterKey(keyId: string, keyBuffer?: Buffer | string): void {
    let key: Buffer;
    if (!keyBuffer) {
      key = crypto.randomBytes(KmsEncryptionService.DEK_LENGTH);
    } else if (typeof keyBuffer === 'string') {
      key = crypto.createHash('sha256').update(keyBuffer).digest();
    } else {
      key = keyBuffer;
    }

    this.masterKeys.set(keyId, {
      keyId,
      key,
      status: 'ACTIVE',
      createdAt: Date.now(),
    });
  }

  /**
   * Rotates the primary Master KMS Key.
   * Future encryptions will use newKeyId, while previous master keys remain available
   * for decrypting existing stored DEKs or re-encrypting them during key rotation.
   */
  public rotateMasterKey(newKeyId: string, newKey?: Buffer | string): void {
    // Demote current primary key to ROTATED
    const currentPrimary = this.masterKeys.get(this.primaryKeyId);
    if (currentPrimary) {
      currentPrimary.status = 'ROTATED';
    }

    this.registerMasterKey(newKeyId, newKey);
    this.primaryKeyId = newKeyId;
    this.logger.log(`Rotated Master KMS Key. New Primary: ${newKeyId}`);
  }

  public getPrimaryKeyId(): string {
    return this.primaryKeyId;
  }

  /**
   * Generates a fresh 256-bit Data Encryption Key (DEK).
   * Encrypts the DEK using the active Master KMS Key with AES-256-GCM.
   */
  public generateDataKey(keyId: string = this.primaryKeyId): {
    plaintextDek: Buffer;
    encryptedDek: string;
    keyId: string;
    dekIv: string;
    dekAuthTag: string;
  } {
    const masterKeyMeta = this.masterKeys.get(keyId);
    if (!masterKeyMeta || masterKeyMeta.status === 'DISABLED') {
      throw new KmsMasterKeyNotFoundException(keyId);
    }

    // 1. Generate 256-bit cryptographically secure random DEK
    const plaintextDek = crypto.randomBytes(KmsEncryptionService.DEK_LENGTH);

    // 2. Encrypt the DEK using Master KMS Key with AES-256-GCM
    const dekIv = crypto.randomBytes(KmsEncryptionService.IV_LENGTH);
    const cipher = crypto.createCipheriv(KmsEncryptionService.ALGORITHM, masterKeyMeta.key, dekIv);

    const encryptedDekBuffer = Buffer.concat([cipher.update(plaintextDek), cipher.final()]);
    const dekAuthTag = cipher.getAuthTag();

    return {
      plaintextDek,
      encryptedDek: encryptedDekBuffer.toString('base64'),
      keyId,
      dekIv: dekIv.toString('base64'),
      dekAuthTag: dekAuthTag.toString('base64'),
    };
  }

  /**
   * Decrypts an encrypted DEK using the specified Master KMS Key.
   * Cryptographically verifies DEK integrity via GCM authentication tag.
   */
  private decryptDataKey(envelope: EncryptedEnvelope): Buffer {
    const masterKeyMeta = this.masterKeys.get(envelope.keyId);
    if (!masterKeyMeta || masterKeyMeta.status === 'DISABLED') {
      throw new KmsMasterKeyNotFoundException(envelope.keyId);
    }

    try {
      const dekIvBuffer = Buffer.from(envelope.dekIv, 'base64');
      const dekAuthTagBuffer = Buffer.from(envelope.dekAuthTag, 'base64');
      const encryptedDekBuffer = Buffer.from(envelope.encryptedDek, 'base64');

      const decipher = crypto.createDecipheriv(
        KmsEncryptionService.ALGORITHM,
        masterKeyMeta.key,
        dekIvBuffer
      );
      decipher.setAuthTag(dekAuthTagBuffer);

      return Buffer.concat([decipher.update(encryptedDekBuffer), decipher.final()]);
    } catch {
      throw new KmsTamperDetectedException(
        `Failed to decrypt DEK under Master Key '${envelope.keyId}': DEK ciphertext or auth tag tampered`
      );
    }
  }

  /**
   * Encrypts plaintext data (e.g. GitHub OAuth token) using the Envelope Encryption pattern.
   * Generates a fresh DEK per token, encrypts data with DEK, and zeroes plaintext DEK immediately.
   */
  public encryptEnvelope(
    plaintext: string | Buffer,
    keyId: string = this.primaryKeyId,
    associatedData?: string
  ): EncryptedEnvelope {
    const dataBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8');

    // 1. Request fresh Data Encryption Key (DEK) from KMS
    const { plaintextDek, encryptedDek, dekIv, dekAuthTag } = this.generateDataKey(keyId);

    try {
      // 2. Encrypt token using fresh DEK with AES-256-GCM
      const payloadIv = crypto.randomBytes(KmsEncryptionService.IV_LENGTH);
      const cipher = crypto.createCipheriv(KmsEncryptionService.ALGORITHM, plaintextDek, payloadIv);

      if (associatedData) {
        cipher.setAAD(Buffer.from(associatedData, 'utf8'));
      }

      const ciphertextBuffer = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      return {
        version: KmsEncryptionService.ENVELOPE_VERSION,
        algorithm: 'AES-256-GCM',
        keyId,
        encryptedDek,
        dekIv,
        dekAuthTag,
        iv: payloadIv.toString('base64'),
        authTag: authTag.toString('base64'),
        ciphertext: ciphertextBuffer.toString('base64'),
        createdAt: Date.now(),
      };
    } finally {
      // 3. ZERO & DESTROY plaintext DEK from memory immediately after encryption
      plaintextDek.fill(0);
    }
  }

  /**
   * Decrypts an envelope-encrypted token.
   * Decrypts the DEK with Master Key, verifies AES-GCM authentication tags, and zeroes DEK.
   */
  public decryptEnvelope(
    envelopeInput: EncryptedEnvelope | string,
    associatedData?: string
  ): string {
    const envelope = typeof envelopeInput === 'string' ? this.deserialize(envelopeInput) : envelopeInput;

    // 1. Decrypt DEK using Master KMS Key
    const plaintextDek = this.decryptDataKey(envelope);

    try {
      // 2. Decrypt payload using plaintext DEK with AES-256-GCM and verify authentication tag
      const payloadIvBuffer = Buffer.from(envelope.iv, 'base64');
      const authTagBuffer = Buffer.from(envelope.authTag, 'base64');
      const ciphertextBuffer = Buffer.from(envelope.ciphertext, 'base64');

      const decipher = crypto.createDecipheriv(
        KmsEncryptionService.ALGORITHM,
        plaintextDek,
        payloadIvBuffer
      );
      decipher.setAuthTag(authTagBuffer);

      if (associatedData) {
        decipher.setAAD(Buffer.from(associatedData, 'utf8'));
      }

      const decryptedBuffer = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);
      return decryptedBuffer.toString('utf8');
    } catch (err: any) {
      if (err instanceof KmsTamperDetectedException) throw err;
      throw new KmsTamperDetectedException(
        `Ciphertext tampering detected: AES-256-GCM tag verification failed (${err.message})`
      );
    } finally {
      // 3. ZERO & DESTROY plaintext DEK from memory immediately after decryption
      plaintextDek.fill(0);
    }
  }

  /**
   * High-level helper: Encrypts a GitHub OAuth token into a compact serialized string.
   */
  public encryptToken(token: string, keyId?: string, associatedData?: string): string {
    const envelope = this.encryptEnvelope(token, keyId, associatedData);
    return this.serialize(envelope);
  }

  /**
   * High-level helper: Decrypts a compact serialized string or envelope into a plaintext token.
   */
  public decryptToken(envelopeOrString: string | EncryptedEnvelope, associatedData?: string): string {
    return this.decryptEnvelope(envelopeOrString, associatedData);
  }

  /**
   * Key Rotation: Re-encrypts the stored Data Encryption Key (DEK) under a new Master KMS Key.
   * Does NOT touch or re-encrypt the underlying ciphertext data.
   */
  public reencryptEnvelope(
    envelopeInput: EncryptedEnvelope | string,
    targetKeyId: string = this.primaryKeyId
  ): EncryptedEnvelope {
    const envelope = typeof envelopeInput === 'string' ? this.deserialize(envelopeInput) : envelopeInput;

    if (envelope.keyId === targetKeyId) {
      return envelope; // Already encrypted under target key
    }

    const targetMasterKey = this.masterKeys.get(targetKeyId);
    if (!targetMasterKey || targetMasterKey.status === 'DISABLED') {
      throw new KmsMasterKeyNotFoundException(targetKeyId);
    }

    // 1. Decrypt DEK using current/old Master Key
    const plaintextDek = this.decryptDataKey(envelope);

    try {
      // 2. Re-encrypt the SAME DEK using the new Master Key
      const newDekIv = crypto.randomBytes(KmsEncryptionService.IV_LENGTH);
      const cipher = crypto.createCipheriv(
        KmsEncryptionService.ALGORITHM,
        targetMasterKey.key,
        newDekIv
      );

      const newEncryptedDekBuffer = Buffer.concat([cipher.update(plaintextDek), cipher.final()]);
      const newDekAuthTag = cipher.getAuthTag();

      // Return updated envelope: only DEK metadata changes, data ciphertext is unchanged!
      return {
        ...envelope,
        keyId: targetKeyId,
        encryptedDek: newEncryptedDekBuffer.toString('base64'),
        dekIv: newDekIv.toString('base64'),
        dekAuthTag: newDekAuthTag.toString('base64'),
      };
    } finally {
      // 3. Wipe plaintext DEK from memory
      plaintextDek.fill(0);
    }
  }

  /**
   * Re-encrypts a serialized token string under a new Master KMS key.
   */
  public reencryptToken(tokenString: string, targetKeyId?: string): string {
    const rotated = this.reencryptEnvelope(tokenString, targetKeyId);
    return this.serialize(rotated);
  }

  /**
   * Serializes an EncryptedEnvelope to a transport-safe string format.
   */
  public serialize(envelope: EncryptedEnvelope): string {
    const payload = JSON.stringify(envelope);
    return `enc:v1:${Buffer.from(payload, 'utf8').toString('base64url')}`;
  }

  /**
   * Deserializes a transport string or validates an EncryptedEnvelope object.
   */
  public deserialize(serialized: string): EncryptedEnvelope {
    if (!serialized || typeof serialized !== 'string') {
      throw new BadRequestException('Invalid envelope encryption payload: must be a non-empty string');
    }

    if (!serialized.startsWith('enc:v1:')) {
      // Attempt standard JSON parse fallback
      try {
        const parsed = JSON.parse(serialized);
        if (this.isValidEnvelope(parsed)) return parsed;
      } catch {
        // Continue to error
      }
      throw new BadRequestException('Invalid envelope encryption format: missing enc:v1 prefix');
    }

    try {
      const base64Data = serialized.slice(7);
      const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf8');
      const parsed = JSON.parse(jsonStr);

      if (!this.isValidEnvelope(parsed)) {
        throw new Error('Missing required envelope cryptographic fields');
      }
      return parsed;
    } catch (err: any) {
      throw new BadRequestException(`Malformed envelope payload: ${err.message}`);
    }
  }

  /**
   * Checks if a value is a valid envelope structure or serialized envelope string.
   */
  public isEnvelope(val: unknown): boolean {
    if (!val) return false;
    if (typeof val === 'string') {
      return val.startsWith('enc:v1:');
    }
    return this.isValidEnvelope(val);
  }

  private isValidEnvelope(val: any): val is EncryptedEnvelope {
    return (
      val &&
      typeof val === 'object' &&
      val.version === 1 &&
      val.algorithm === 'AES-256-GCM' &&
      typeof val.keyId === 'string' &&
      typeof val.encryptedDek === 'string' &&
      typeof val.dekIv === 'string' &&
      typeof val.dekAuthTag === 'string' &&
      typeof val.iv === 'string' &&
      typeof val.authTag === 'string' &&
      typeof val.ciphertext === 'string'
    );
  }
}
