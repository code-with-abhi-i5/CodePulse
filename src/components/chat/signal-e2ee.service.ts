/**
 * Signal Protocol E2EE Service
 * Implements Double Ratchet + Extended Triple Diffie-Hellman (X3DH)
 * with AES-256-GCM + HMAC-SHA256 authenticated encryption, forward secrecy,
 * out-of-order message tolerance, and 60-digit safety number fingerprinting (#541).
 */

import * as crypto from 'crypto';

export interface KeyPair {
  publicKey: string; // Base64 encoded SPKI / Raw public key
  privateKey: string; // Base64 encoded PKCS8 / Raw private key
}

export interface OneTimePreKey {
  keyId: number;
  publicKey: string;
  privateKey?: string;
}

export interface PreKeyBundle {
  userId: string;
  registrationId: number;
  identityKey: string;
  signedPreKeyId: number;
  signedPreKey: string;
  signedPreKeySignature: string;
  oneTimePreKey?: OneTimePreKey;
}

export interface EncryptedMessagePayload {
  recipientId?: string;
  teamId?: string;
  ephemeralKey: string; // Ratchet public key of sender
  sequenceNumber: number;
  previousChainLength: number;
  ciphertext: string;
  iv: string;
  authTag: string;
  hmacSignature: string;
}

/**
 * Derives symmetric keys using HKDF-SHA256
 */
function hkdf(
  ikm: Buffer,
  length: number,
  salt: Buffer = Buffer.alloc(32, 0),
  info: Buffer = Buffer.from('WhisperRatchet', 'utf8'),
): Buffer {
  const result = crypto.hkdfSync('sha256', ikm, salt, info, length);
  return Buffer.from(result);
}

/**
 * Computes HMAC-SHA256
 */
function hmacSha256(key: Buffer, data: Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

/**
 * Computes Diffie-Hellman shared secret between local private key and remote public key (P-256 / prime256v1)
 */
export function computeDH(privateKeyBase64: string, publicKeyBase64: string): Buffer {
  const privKeyObj = crypto.createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  const pubKeyObj = crypto.createPublicKey({
    key: Buffer.from(publicKeyBase64, 'base64'),
    format: 'der',
    type: 'spki',
  });

  return crypto.diffieHellman({
    privateKey: privKeyObj,
    publicKey: pubKeyObj,
  });
}

/**
 * Generates an Elliptic Curve (P-256 / prime256v1) key pair in DER/base64 format
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  return {
    publicKey: publicKey.toString('base64'),
    privateKey: privateKey.toString('base64'),
  };
}

/**
 * Signs data using ECDSA-SHA256
 */
export function signData(privateKeyBase64: string, data: Buffer): string {
  const privKeyObj = crypto.createPrivateKey({
    key: Buffer.from(privateKeyBase64, 'base64'),
    format: 'der',
    type: 'pkcs8',
  });
  return crypto.sign('sha256', data, privKeyObj).toString('base64');
}

/**
 * Verifies ECDSA-SHA256 signature
 */
export function verifySignature(
  publicKeyBase64: string,
  data: Buffer,
  signatureBase64: string,
): boolean {
  try {
    const pubKeyObj = crypto.createPublicKey({
      key: Buffer.from(publicKeyBase64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    return crypto.verify(
      'sha256',
      data,
      pubKeyObj,
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch {
    return false;
  }
}

/**
 * Double Ratchet Session State
 */
export class DoubleRatchetSession {
  public rootKey: Buffer;
  public sendChainKey: Buffer | null = null;
  public recvChainKey: Buffer | null = null;
  public localRatchetKeyPair: KeyPair;
  public remoteRatchetPublicKey: string | null = null;
  public sendSeqNumber = 0;
  public recvSeqNumber = 0;
  public previousChainLength = 0;
  public skippedMessageKeys = new Map<string, { aesKey: Buffer; hmacKey: Buffer }>();

  constructor(
    sharedMasterKey: Buffer,
    localRatchetKey: KeyPair,
    remoteRatchetPubKey: string | null = null,
    isInitiator: boolean = false,
  ) {
    this.rootKey = sharedMasterKey;
    this.localRatchetKeyPair = localRatchetKey;
    this.remoteRatchetPublicKey = remoteRatchetPubKey;

    if (isInitiator && remoteRatchetPubKey) {
      // Initiator immediately takes DH ratchet step to initialize sending chain
      const dhSecret = computeDH(this.localRatchetKeyPair.privateKey, remoteRatchetPubKey);
      const derived = hkdf(dhSecret, 64, this.rootKey, Buffer.from('WhisperRatchetRoot', 'utf8'));
      this.rootKey = derived.subarray(0, 32);
      this.sendChainKey = derived.subarray(32, 64);
    }
  }

  /**
   * Encrypts an outgoing chat message with advancing forward-secrecy ratchet
   */
  public encrypt(plaintext: string): EncryptedMessagePayload {
    if (!this.sendChainKey) {
      if (!this.remoteRatchetPublicKey) {
        throw new Error('Cannot encrypt: Remote ratchet public key not established');
      }
      // Advance root key with new DH output
      const dhOutput = computeDH(
        this.localRatchetKeyPair.privateKey,
        this.remoteRatchetPublicKey,
      );
      const derived = hkdf(dhOutput, 64, this.rootKey, Buffer.from('WhisperRatchetRoot', 'utf8'));
      this.rootKey = derived.subarray(0, 32);
      this.sendChainKey = derived.subarray(32, 64);
    }

    // Advance symmetric chain: (CK_next, MK) = KDF_CK(CK)
    const messageKey = hmacSha256(this.sendChainKey, Buffer.from([0x01]));
    this.sendChainKey = hmacSha256(this.sendChainKey, Buffer.from([0x02]));

    // Derive 32-byte AES key and 32-byte HMAC key from message key
    const derivedKeys = hkdf(
      messageKey,
      64,
      Buffer.alloc(32, 0),
      Buffer.from('WhisperMessageKeys', 'utf8'),
    );
    const aesKey = derivedKeys.subarray(0, 32);
    const hmacKey = derivedKeys.subarray(32, 64);

    // Encrypt payload with AES-256-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const currentSeq = this.sendSeqNumber++;

    // Compute HMAC-SHA256 signature over (header + ciphertext + iv + authTag)
    const headerBuffer = Buffer.from(
      `${this.localRatchetKeyPair.publicKey}:${currentSeq}:${this.previousChainLength}`,
      'utf8',
    );
    const macData = Buffer.concat([headerBuffer, iv, authTag, encrypted]);
    const signature = hmacSha256(hmacKey, macData).toString('base64');

    return {
      ephemeralKey: this.localRatchetKeyPair.publicKey,
      sequenceNumber: currentSeq,
      previousChainLength: this.previousChainLength,
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      hmacSignature: signature,
    };
  }

  /**
   * Decrypts an incoming message and advances receiving ratchet state
   */
  public decrypt(payload: EncryptedMessagePayload): string {
    const { ephemeralKey, sequenceNumber, previousChainLength, ciphertext, iv, authTag, hmacSignature } = payload;
    const cipherBuffer = Buffer.from(ciphertext, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(authTag, 'base64');

    // 1. Check if key is already in skipped keys
    const skippedKeyId = `${ephemeralKey}:${sequenceNumber}`;
    let keys = this.skippedMessageKeys.get(skippedKeyId);

    if (keys) {
      this.skippedMessageKeys.delete(skippedKeyId);
    } else {
      // 2. If new remote ratchet key, perform DH ratchet step
      if (ephemeralKey !== this.remoteRatchetPublicKey) {
        this.skipMessageKeys(previousChainLength);
        this.dhRatchetStep(ephemeralKey);
      }

      // 3. Skip missed message keys in current receiving chain
      this.skipMessageKeys(sequenceNumber);

      // 4. Advance receiving chain to sequenceNumber
      const messageKey = hmacSha256(this.recvChainKey!, Buffer.from([0x01]));
      this.recvChainKey = hmacSha256(this.recvChainKey!, Buffer.from([0x02]));
      this.recvSeqNumber++;

      const derivedKeys = hkdf(
        messageKey,
        64,
        Buffer.alloc(32, 0),
        Buffer.from('WhisperMessageKeys', 'utf8'),
      );
      keys = {
        aesKey: derivedKeys.subarray(0, 32),
        hmacKey: derivedKeys.subarray(32, 64),
      };
    }

    // 5. Verify HMAC-SHA256 signature
    const headerBuffer = Buffer.from(`${ephemeralKey}:${sequenceNumber}:${previousChainLength}`, 'utf8');
    const macData = Buffer.concat([headerBuffer, ivBuffer, tagBuffer, cipherBuffer]);
    const computedSignature = hmacSha256(keys.hmacKey, macData).toString('base64');

    if (computedSignature !== hmacSignature) {
      throw new Error('Message authentication failed: HMAC signature mismatch');
    }

    // 6. Decrypt AES-256-GCM ciphertext
    const decipher = crypto.createDecipheriv('aes-256-gcm', keys.aesKey, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);

    return decrypted.toString('utf8');
  }

  private skipMessageKeys(untilSeqNumber: number): void {
    if (!this.recvChainKey) return;
    while (this.recvSeqNumber < untilSeqNumber) {
      const mk = hmacSha256(this.recvChainKey, Buffer.from([0x01]));
      this.recvChainKey = hmacSha256(this.recvChainKey, Buffer.from([0x02]));

      const derived = hkdf(mk, 64, Buffer.alloc(32, 0), Buffer.from('WhisperMessageKeys', 'utf8'));
      const keyId = `${this.remoteRatchetPublicKey}:${this.recvSeqNumber}`;
      this.skippedMessageKeys.set(keyId, {
        aesKey: derived.subarray(0, 32),
        hmacKey: derived.subarray(32, 64),
      });
      this.recvSeqNumber++;
    }
  }

  private dhRatchetStep(remoteRatchetKey: string): void {
    this.previousChainLength = this.sendSeqNumber;
    this.sendSeqNumber = 0;
    this.recvSeqNumber = 0;
    this.remoteRatchetPublicKey = remoteRatchetKey;

    // Recv chain advancement: DH(localRatchet, remoteRatchet)
    const dhRecv = computeDH(this.localRatchetKeyPair.privateKey, remoteRatchetKey);
    const derivedRecv = hkdf(dhRecv, 64, this.rootKey, Buffer.from('WhisperRatchetRoot', 'utf8'));
    this.rootKey = derivedRecv.subarray(0, 32);
    this.recvChainKey = derivedRecv.subarray(32, 64);

    // Send chain advancement: generate new local ratchet pair and compute DH(newLocal, remoteRatchet)
    this.localRatchetKeyPair = generateKeyPair();
    const dhSend = computeDH(this.localRatchetKeyPair.privateKey, remoteRatchetKey);
    const derivedSend = hkdf(dhSend, 64, this.rootKey, Buffer.from('WhisperRatchetRoot', 'utf8'));
    this.rootKey = derivedSend.subarray(0, 32);
    this.sendChainKey = derivedSend.subarray(32, 64);
  }
}

/**
 * Signal Protocol E2EE Service
 * Orchestrates X3DH key agreements, session management, and safety numbers.
 */
export class SignalE2EEService {
  private static instance: SignalE2EEService | null = null;
  private identityKeyPair: KeyPair;
  private signedPreKeyPair: KeyPair;
  private signedPreKeySignature: string;
  private oneTimePreKeys: OneTimePreKey[] = [];
  private registrationId: number;
  private sessions = new Map<string, DoubleRatchetSession>();

  constructor() {
    this.registrationId = Math.floor(Math.random() * 10000) + 1;
    this.identityKeyPair = generateKeyPair();
    this.signedPreKeyPair = generateKeyPair();
    this.signedPreKeySignature = signData(
      this.identityKeyPair.privateKey,
      Buffer.from(this.signedPreKeyPair.publicKey, 'base64'),
    );
    this.generateOneTimePreKeys(1, 20);
  }

  public static getInstance(): SignalE2EEService {
    if (!SignalE2EEService.instance) {
      SignalE2EEService.instance = new SignalE2EEService();
    }
    return SignalE2EEService.instance;
  }

  public static resetInstance(): void {
    SignalE2EEService.instance = null;
  }

  public getIdentityPublicKey(): string {
    return this.identityKeyPair.publicKey;
  }

  public getRegistrationId(): number {
    return this.registrationId;
  }

  /**
   * Generates a batch of One-Time PreKeys
   */
  public generateOneTimePreKeys(startId: number, count: number): OneTimePreKey[] {
    const generated: OneTimePreKey[] = [];
    for (let i = 0; i < count; i++) {
      const kp = generateKeyPair();
      const otpk: OneTimePreKey = {
        keyId: startId + i,
        publicKey: kp.publicKey,
        privateKey: kp.privateKey,
      };
      this.oneTimePreKeys.push(otpk);
      generated.push({ keyId: otpk.keyId, publicKey: otpk.publicKey });
    }
    return generated;
  }

  /**
   * Prepares the public PreKey bundle for backend publication
   */
  public exportPreKeyBundle(userId: string): PreKeyBundle {
    return {
      userId,
      registrationId: this.registrationId,
      identityKey: this.identityKeyPair.publicKey,
      signedPreKeyId: 1,
      signedPreKey: this.signedPreKeyPair.publicKey,
      signedPreKeySignature: this.signedPreKeySignature,
      oneTimePreKey: this.oneTimePreKeys[0]
        ? {
            keyId: this.oneTimePreKeys[0].keyId,
            publicKey: this.oneTimePreKeys[0].publicKey,
          }
        : undefined,
    };
  }

  /**
   * Alice (Initiator) creates session using Bob's published PreKey bundle via X3DH
   */
  public initiateSession(peerId: string, bobsBundle: PreKeyBundle): DoubleRatchetSession {
    const ephemeralKey = generateKeyPair();

    // 1. Verify Bob's signed prekey signature
    const isSigValid = verifySignature(
      bobsBundle.identityKey,
      Buffer.from(bobsBundle.signedPreKey, 'base64'),
      bobsBundle.signedPreKeySignature,
    );
    if (!isSigValid) {
      throw new Error('Security Error: Bob SignedPreKey signature verification failed (MITM detected)');
    }

    // 2. Perform 3DH / 4DH
    const dh1 = computeDH(this.identityKeyPair.privateKey, bobsBundle.signedPreKey);
    const dh2 = computeDH(ephemeralKey.privateKey, bobsBundle.identityKey);
    const dh3 = computeDH(ephemeralKey.privateKey, bobsBundle.signedPreKey);

    const dhParts = [dh1, dh2, dh3];
    if (bobsBundle.oneTimePreKey) {
      const dh4 = computeDH(ephemeralKey.privateKey, bobsBundle.oneTimePreKey.publicKey);
      dhParts.push(dh4);
    }

    const masterSecret = hkdf(
      Buffer.concat(dhParts),
      32,
      Buffer.alloc(32, 0),
      Buffer.from('WhisperText', 'utf8'),
    );

    const session = new DoubleRatchetSession(
      masterSecret,
      ephemeralKey,
      bobsBundle.signedPreKey,
      true,
    );

    this.sessions.set(peerId, session);
    return session;
  }

  /**
   * Bob (Receiver) builds matching session from Alice's initial handshake keys
   */
  public receiveSession(
    peerId: string,
    aliceIdentityKey: string,
    aliceEphemeralKey: string,
    usedOneTimeKeyId?: number,
  ): DoubleRatchetSession {
    // Bob performs matching DH operations
    const dh1 = computeDH(this.signedPreKeyPair.privateKey, aliceIdentityKey);
    const dh2 = computeDH(this.identityKeyPair.privateKey, aliceEphemeralKey);
    const dh3 = computeDH(this.signedPreKeyPair.privateKey, aliceEphemeralKey);

    const dhParts = [dh1, dh2, dh3];
    if (usedOneTimeKeyId !== undefined) {
      const otpk = this.oneTimePreKeys.find((k) => k.keyId === usedOneTimeKeyId);
      if (otpk && otpk.privateKey) {
        const dh4 = computeDH(otpk.privateKey, aliceEphemeralKey);
        dhParts.push(dh4);
      }
    }

    const masterSecret = hkdf(
      Buffer.concat(dhParts),
      32,
      Buffer.alloc(32, 0),
      Buffer.from('WhisperText', 'utf8'),
    );

    const session = new DoubleRatchetSession(
      masterSecret,
      this.signedPreKeyPair,
      null,
      false,
    );

    this.sessions.set(peerId, session);
    return session;
  }

  public getSession(peerId: string): DoubleRatchetSession | undefined {
    return this.sessions.get(peerId);
  }

  /**
   * Computes a standard 60-digit safety number fingerprint (12 blocks of 5 decimal digits)
   */
  public computeSafetyNumber(myUserId: string, peerUserId: string, peerIdentityKey: string): string {
    const [first, second] = [
      { id: myUserId, key: this.identityKeyPair.publicKey },
      { id: peerUserId, key: peerIdentityKey },
    ].sort((a, b) => a.id.localeCompare(b.id));

    const hash = crypto.createHash('sha512');
    hash.update(first.id, 'utf8');
    hash.update(Buffer.from(first.key, 'base64'));
    hash.update(second.id, 'utf8');
    hash.update(Buffer.from(second.key, 'base64'));
    const digest = hash.digest();

    const blocks: string[] = [];
    for (let i = 0; i < 12; i++) {
      const offset = i * 2;
      const num = digest.readUInt16BE(offset) % 100000;
      blocks.push(num.toString().padStart(5, '0'));
    }
    return blocks.join(' ');
  }
}
