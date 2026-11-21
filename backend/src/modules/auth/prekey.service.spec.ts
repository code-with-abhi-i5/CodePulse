import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PreKeyService } from './prekey.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

describe('PreKeyService (#541 E2EE Signal Protocol PreKey Distribution)', () => {
  let service: PreKeyService;

  const mockPrismaService = {
    signalPreKeyBundle: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    encryptedChatMessage: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreKeyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PreKeyService>(PreKeyService);
    service.resetState();
  });

  describe('PreKey Bundle Publishing & Retrieval', () => {
    it('publishes and retrieves an initial PreKey bundle with OTPKs', async () => {
      const aliceBundle = {
        userId: 'user-alice-123',
        registrationId: 4567,
        identityKey: crypto.randomBytes(32).toString('base64'),
        signedPreKeyId: 1,
        signedPreKey: crypto.randomBytes(32).toString('base64'),
        signedPreKeySignature: crypto.randomBytes(64).toString('base64'),
        oneTimePreKeys: [
          { keyId: 101, publicKey: crypto.randomBytes(32).toString('base64') },
          { keyId: 102, publicKey: crypto.randomBytes(32).toString('base64') },
        ],
      };

      const result = await service.publishPreKeyBundle('user-alice-123', aliceBundle);
      expect(result.success).toBe(true);
      expect(result.totalPreKeys).toBe(2);

      // Verify status check
      const status = await service.getRemainingPreKeysCount('user-alice-123');
      expect(status.remainingCount).toBe(2);

      // First fetch should consume OTPK #101
      const fetched1 = await service.getPreKeyBundle('user-alice-123');
      expect(fetched1.userId).toBe('user-alice-123');
      expect(fetched1.identityKey).toBe(aliceBundle.identityKey);
      expect(fetched1.oneTimePreKey).toBeDefined();
      expect(fetched1.oneTimePreKey?.keyId).toBe(101);

      // Remaining count should decrease to 1
      const statusAfter1 = await service.getRemainingPreKeysCount('user-alice-123');
      expect(statusAfter1.remainingCount).toBe(1);

      // Second fetch consumes OTPK #102
      const fetched2 = await service.getPreKeyBundle('user-alice-123');
      expect(fetched2.oneTimePreKey?.keyId).toBe(102);

      // Third fetch when pool is exhausted falls back to 3DH (oneTimePreKey undefined)
      const fetched3 = await service.getPreKeyBundle('user-alice-123');
      expect(fetched3.oneTimePreKey).toBeUndefined();
      expect(fetched3.identityKey).toBe(aliceBundle.identityKey);
    });

    it('throws NotFoundException when fetching unverified user bundle', async () => {
      await expect(service.getPreKeyBundle('non-existent-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects bundle registration missing cryptographic fields', async () => {
      await expect(
        service.publishPreKeyBundle('alice', {
          registrationId: 1,
          identityKey: '',
          signedPreKeyId: 1,
          signedPreKey: '',
          signedPreKeySignature: '',
          oneTimePreKeys: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Encrypted Chat Message Storage (Zero-Knowledge Ciphertext)', () => {
    it('stores authenticated ciphertext payloads where server cannot inspect plaintext', async () => {
      const messagePayload = {
        recipientId: 'bob-789',
        ephemeralKey: crypto.randomBytes(32).toString('base64'),
        sequenceNumber: 0,
        previousChainLength: 0,
        ciphertext: crypto.randomBytes(48).toString('base64'),
        iv: crypto.randomBytes(12).toString('base64'),
        authTag: crypto.randomBytes(16).toString('base64'),
        hmacSignature: crypto.randomBytes(32).toString('base64'),
      };

      const stored = await service.storeEncryptedMessage('alice-456', messagePayload);
      expect(stored.id).toBeDefined();
      expect(stored.senderId).toBe('alice-456');
      expect(stored.recipientId).toBe('bob-789');
      expect(stored.ciphertext).toBe(messagePayload.ciphertext);
      expect(stored.hmacSignature).toBe(messagePayload.hmacSignature);

      // Query message
      const messages = await service.getEncryptedMessages({ recipientId: 'bob-789' });
      expect(messages.length).toBe(1);
      expect(messages[0].id).toBe(stored.id);
    });

    it('rejects messages missing IV, authTag or ciphertext', async () => {
      await expect(
        service.storeEncryptedMessage('alice', {
          ephemeralKey: 'key',
          sequenceNumber: 1,
          previousChainLength: 0,
          ciphertext: '',
          iv: '',
          authTag: '',
          hmacSignature: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Safety Number Fingerprint Verification', () => {
    it('generates symmetric 60-digit fingerprint for both participants regardless of call order', () => {
      const userAId = 'usr-001';
      const keyA = crypto.randomBytes(32).toString('base64');
      const userBId = 'usr-002';
      const keyB = crypto.randomBytes(32).toString('base64');

      const fingerprint1 = service.computeSafetyNumber(userAId, keyA, userBId, keyB);
      const fingerprint2 = service.computeSafetyNumber(userBId, keyB, userAId, keyA);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1.split(' ').length).toBe(12);
      fingerprint1.split(' ').forEach((block) => {
        expect(block.length).toBe(5);
        expect(/^\d{5}$/.test(block)).toBe(true);
      });
    });

    it('changes fingerprint completely if an identity key is modified (MITM detection)', () => {
      const userAId = 'usr-001';
      const keyA = crypto.randomBytes(32).toString('base64');
      const userBId = 'usr-002';
      const keyB = crypto.randomBytes(32).toString('base64');
      const attackerKey = crypto.randomBytes(32).toString('base64');

      const authentic = service.computeSafetyNumber(userAId, keyA, userBId, keyB);
      const tampered = service.computeSafetyNumber(userAId, keyA, userBId, attackerKey);

      expect(authentic).not.toBe(tampered);
    });
  });
});
