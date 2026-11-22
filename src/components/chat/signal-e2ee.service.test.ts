import { describe, it, expect, beforeEach } from 'vitest';
import {
  SignalE2EEService,
  generateKeyPair,
  computeDH,
  signData,
  verifySignature,
} from './signal-e2ee.service';

describe('Signal Protocol E2EE Service (#541 Double Ratchet + X3DH)', () => {
  let aliceService: SignalE2EEService;
  let bobService: SignalE2EEService;

  beforeEach(() => {
    SignalE2EEService.resetInstance();
    aliceService = new SignalE2EEService();
    bobService = new SignalE2EEService();
  });

  describe('Cryptographic Primitives', () => {
    it('generates valid X25519 key pairs and verifies Diffie-Hellman symmetry', () => {
      const aliceKeys = generateKeyPair();
      const bobKeys = generateKeyPair();

      const secretAB = computeDH(aliceKeys.privateKey, bobKeys.publicKey);
      const secretBA = computeDH(bobKeys.privateKey, aliceKeys.publicKey);

      expect(secretAB.length).toBe(32);
      expect(secretBA.length).toBe(32);
      expect(secretAB.equals(secretBA)).toBe(true);
    });

    it('signs and verifies prekey bundles accurately', () => {
      const identityKey = generateKeyPair();
      const signedPreKey = generateKeyPair();
      const payload = Buffer.from(signedPreKey.publicKey, 'base64');

      const sig = signData(identityKey.privateKey, payload);
      expect(verifySignature(identityKey.publicKey, payload, sig)).toBe(true);

      // Fails on tampered payload
      const tampered = Buffer.from('corrupted-data');
      expect(verifySignature(identityKey.publicKey, tampered, sig)).toBe(false);
    });
  });

  describe('X3DH Key Agreement & Session Establishment', () => {
    it('establishes shared Double Ratchet sessions between Alice and Bob', () => {
      const bobBundle = bobService.exportPreKeyBundle('user-bob');
      expect(bobBundle.identityKey).toBe(bobService.getIdentityPublicKey());
      expect(bobBundle.signedPreKey).toBeDefined();

      // Alice initiates session using Bob's PreKey bundle
      const aliceSession = aliceService.initiateSession('user-bob', bobBundle);
      expect(aliceSession).toBeDefined();

      // Bob accepts session using Alice's identity key & ephemeral ratchet key
      const bobSession = bobService.receiveSession(
        'user-alice',
        aliceService.getIdentityPublicKey(),
        aliceSession.localRatchetKeyPair.publicKey,
        bobBundle.oneTimePreKey?.keyId,
      );
      expect(bobSession).toBeDefined();

      // Alice sends encrypted message
      const secretMessage = 'Hello Bob, this is private competitive strategy!';
      const encrypted = aliceSession.encrypt(secretMessage);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.ciphertext).not.toBe(secretMessage);
      expect(encrypted.hmacSignature).toBeDefined();

      // Bob decrypts message
      const decrypted = bobSession.decrypt(encrypted);
      expect(decrypted).toBe(secretMessage);
    });

    it('rejects X3DH handshake if Bob signed prekey signature is forged', () => {
      const forgedBundle = bobService.exportPreKeyBundle('user-bob');
      forgedBundle.signedPreKeySignature = Buffer.alloc(32, 7).toString('base64');

      expect(() => {
        aliceService.initiateSession('user-bob', forgedBundle);
      }).toThrow(/Bob SignedPreKey signature verification failed/);
    });
  });

  describe('Double Ratchet Message Exchange & Forward Secrecy', () => {
    it('advances forward secrecy ratchet across multiple two-way ping-pong turns', () => {
      const bobBundle = bobService.exportPreKeyBundle('user-bob');
      const aliceSession = aliceService.initiateSession('user-bob', bobBundle);
      const bobSession = bobService.receiveSession(
        'user-alice',
        aliceService.getIdentityPublicKey(),
        aliceSession.localRatchetKeyPair.publicKey,
        bobBundle.oneTimePreKey?.keyId,
      );

      // Turn 1: Alice -> Bob
      const msg1 = 'Alice: Turn 1 move payload';
      const enc1 = aliceSession.encrypt(msg1);
      expect(bobSession.decrypt(enc1)).toBe(msg1);

      // Turn 2: Bob -> Alice (triggers DH ratchet step)
      const msg2 = 'Bob: Counter move';
      const enc2 = bobSession.encrypt(msg2);
      expect(aliceSession.decrypt(enc2)).toBe(msg2);

      // Turn 3: Alice -> Bob
      const msg3 = 'Alice: Turn 3 attack strategy';
      const enc3 = aliceSession.encrypt(msg3);
      expect(bobSession.decrypt(enc3)).toBe(msg3);

      // Verify sequence counters advanced
      expect(aliceSession.sendSeqNumber).toBe(1);
      expect(bobSession.recvSeqNumber).toBe(1);
    });

    it('supports multiple sequential messages from same party without remote turn (symmetric ratchet)', () => {
      const bobBundle = bobService.exportPreKeyBundle('user-bob');
      const aliceSession = aliceService.initiateSession('user-bob', bobBundle);
      const bobSession = bobService.receiveSession(
        'user-alice',
        aliceService.getIdentityPublicKey(),
        aliceSession.localRatchetKeyPair.publicKey,
        bobBundle.oneTimePreKey?.keyId,
      );

      const m1 = aliceSession.encrypt('Burst message 1');
      const m2 = aliceSession.encrypt('Burst message 2');
      const m3 = aliceSession.encrypt('Burst message 3');

      expect(m1.sequenceNumber).toBe(0);
      expect(m2.sequenceNumber).toBe(1);
      expect(m3.sequenceNumber).toBe(2);

      expect(bobSession.decrypt(m1)).toBe('Burst message 1');
      expect(bobSession.decrypt(m2)).toBe('Burst message 2');
      expect(bobSession.decrypt(m3)).toBe('Burst message 3');
    });

    it('handles out-of-order message delivery via skipped message keys', () => {
      const bobBundle = bobService.exportPreKeyBundle('user-bob');
      const aliceSession = aliceService.initiateSession('user-bob', bobBundle);
      const bobSession = bobService.receiveSession(
        'user-alice',
        aliceService.getIdentityPublicKey(),
        aliceSession.localRatchetKeyPair.publicKey,
        bobBundle.oneTimePreKey?.keyId,
      );

      const enc0 = aliceSession.encrypt('Message 0');
      const enc1 = aliceSession.encrypt('Message 1');
      const enc2 = aliceSession.encrypt('Message 2');

      // Bob receives message 2 first (skipping 0 and 1)
      expect(bobSession.decrypt(enc2)).toBe('Message 2');

      // Then receives message 0 from skipped keys
      expect(bobSession.decrypt(enc0)).toBe('Message 0');

      // Then receives message 1
      expect(bobSession.decrypt(enc1)).toBe('Message 1');
    });

    it('detects tampering and rejects corrupted ciphertext or forged HMAC', () => {
      const bobBundle = bobService.exportPreKeyBundle('user-bob');
      const aliceSession = aliceService.initiateSession('user-bob', bobBundle);
      const bobSession = bobService.receiveSession(
        'user-alice',
        aliceService.getIdentityPublicKey(),
        aliceSession.localRatchetKeyPair.publicKey,
        bobBundle.oneTimePreKey?.keyId,
      );

      const authentic = aliceSession.encrypt('Tamper test payload');

      // Case 1: Corrupted ciphertext
      const tamperedCipher = {
        ...authentic,
        ciphertext: Buffer.from('malicious-payload-123456789012345').toString('base64'),
      };
      expect(() => bobSession.decrypt(tamperedCipher)).toThrow(/Message authentication failed/);

      // Case 2: Tampered HMAC signature
      const tamperedHmac = {
        ...authentic,
        hmacSignature: Buffer.alloc(32, 9).toString('base64'),
      };
      expect(() => bobSession.decrypt(tamperedHmac)).toThrow(/Message authentication failed/);
    });
  });

  describe('Safety Number Fingerprint Verification', () => {
    it('computes identical 60-digit fingerprint for Alice and Bob in chat modal', () => {
      const fpAlice = aliceService.computeSafetyNumber(
        'alice-uid',
        'bob-uid',
        bobService.getIdentityPublicKey(),
      );

      const fpBob = bobService.computeSafetyNumber(
        'bob-uid',
        'alice-uid',
        aliceService.getIdentityPublicKey(),
      );

      expect(fpAlice).toBe(fpBob);
      expect(fpAlice.split(' ').length).toBe(12);
      fpAlice.split(' ').forEach((block) => {
        expect(block.length).toBe(5);
        expect(/^\d{5}$/.test(block)).toBe(true);
      });
    });

    it('detects MITM attack if peer identity key is substituted', () => {
      const legitimate = aliceService.computeSafetyNumber(
        'alice-uid',
        'bob-uid',
        bobService.getIdentityPublicKey(),
      );

      const attackerIdentity = generateKeyPair().publicKey;
      const intercepted = aliceService.computeSafetyNumber(
        'alice-uid',
        'bob-uid',
        attackerIdentity,
      );

      expect(legitimate).not.toBe(intercepted);
    });
  });
});
