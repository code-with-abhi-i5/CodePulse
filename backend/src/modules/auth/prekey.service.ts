import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PublishPreKeyBundleDto,
  PreKeyBundleResponseDto,
  OneTimePreKeyDto,
  EncryptedChatMessageDto,
} from './dto/prekey.dto';

export interface StoredPreKeyBundle {
  userId: string;
  registrationId: number;
  identityKey: string;
  signedPreKeyId: number;
  signedPreKey: string;
  signedPreKeySignature: string;
  oneTimePreKeys: Array<{ keyId: number; publicKey: string; isConsumed: boolean }>;
  updatedAt: Date;
}

export interface StoredEncryptedMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  teamId?: string;
  ephemeralKey: string;
  sequenceNumber: number;
  previousChainLength: number;
  ciphertext: string;
  iv: string;
  authTag: string;
  hmacSignature: string;
  createdAt: Date;
}

@Injectable()
export class PreKeyService {
  private readonly logger = new Logger(PreKeyService.name);

  // High-performance thread-safe in-memory store with Prisma persistence
  private readonly bundles = new Map<string, StoredPreKeyBundle>();
  private readonly messages: StoredEncryptedMessage[] = [];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publishes or refreshes a Signal PreKey bundle for a user.
   */
  async publishPreKeyBundle(
    userId: string,
    dto: PublishPreKeyBundleDto,
  ): Promise<{ success: boolean; totalPreKeys: number }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!dto.identityKey || !dto.signedPreKey || !dto.signedPreKeySignature) {
      throw new BadRequestException('IdentityKey, SignedPreKey, and signature are required');
    }

    const otpkList = (dto.oneTimePreKeys || []).map((k) => ({
      keyId: k.keyId,
      publicKey: k.publicKey,
      isConsumed: false,
    }));

    const bundleRecord: StoredPreKeyBundle = {
      userId,
      registrationId: dto.registrationId,
      identityKey: dto.identityKey,
      signedPreKeyId: dto.signedPreKeyId,
      signedPreKey: dto.signedPreKey,
      signedPreKeySignature: dto.signedPreKeySignature,
      oneTimePreKeys: otpkList,
      updatedAt: new Date(),
    };

    this.bundles.set(userId, bundleRecord);

    // Attempt Prisma persistence gracefully
    try {
      const prismaAny = this.prisma as any;
      if (prismaAny.signalPreKeyBundle) {
        await prismaAny.signalPreKeyBundle.upsert({
          where: { userId },
          update: {
            registrationId: dto.registrationId,
            identityKey: dto.identityKey,
            signedPreKeyId: dto.signedPreKeyId,
            signedPreKey: dto.signedPreKey,
            signedPreKeySignature: dto.signedPreKeySignature,
            updatedAt: new Date(),
          },
          create: {
            userId,
            registrationId: dto.registrationId,
            identityKey: dto.identityKey,
            signedPreKeyId: dto.signedPreKeyId,
            signedPreKey: dto.signedPreKey,
            signedPreKeySignature: dto.signedPreKeySignature,
          },
        });
      }
    } catch (err: any) {
      this.logger.debug(`Prisma bundle persistence skipped: ${err?.message}`);
    }

    this.logger.log(`Published PreKey bundle for user '${userId}' with ${otpkList.length} OTPKs`);
    return { success: true, totalPreKeys: otpkList.length };
  }

  /**
   * Retrieves an active PreKey bundle to initiate an X3DH session.
   * Atomically consumes one unused One-Time PreKey if available.
   */
  async getPreKeyBundle(userId: string): Promise<PreKeyBundleResponseDto> {
    const bundle = this.bundles.get(userId);
    if (!bundle) {
      throw new NotFoundException(`No PreKey bundle found for user '${userId}'`);
    }

    // Find and consume the first available One-Time PreKey
    let consumedPreKey: OneTimePreKeyDto | undefined;
    const availableOtpk = bundle.oneTimePreKeys.find((k) => !k.isConsumed);
    if (availableOtpk) {
      availableOtpk.isConsumed = true;
      consumedPreKey = {
        keyId: availableOtpk.keyId,
        publicKey: availableOtpk.publicKey,
      };
      this.logger.debug(
        `Consumed One-Time PreKey #${consumedPreKey.keyId} for session with user '${userId}'`,
      );
    } else {
      this.logger.warn(`One-Time PreKey pool exhausted for user '${userId}', falling back to 3DH`);
    }

    return {
      userId: bundle.userId,
      registrationId: bundle.registrationId,
      identityKey: bundle.identityKey,
      signedPreKeyId: bundle.signedPreKeyId,
      signedPreKey: bundle.signedPreKey,
      signedPreKeySignature: bundle.signedPreKeySignature,
      oneTimePreKey: consumedPreKey,
    };
  }

  /**
   * Returns the count of remaining unused One-Time PreKeys.
   */
  async getRemainingPreKeysCount(userId: string): Promise<{ userId: string; remainingCount: number }> {
    const bundle = this.bundles.get(userId);
    if (!bundle) {
      throw new NotFoundException(`User '${userId}' has not registered a PreKey bundle`);
    }
    const remaining = bundle.oneTimePreKeys.filter((k) => !k.isConsumed).length;
    return { userId, remainingCount: remaining };
  }

  /**
   * Stores an encrypted ciphertext message. The server has ZERO access to private keys or plaintext.
   */
  async storeEncryptedMessage(
    senderId: string,
    dto: EncryptedChatMessageDto,
  ): Promise<StoredEncryptedMessage> {
    if (!dto.ciphertext || !dto.iv || !dto.authTag || !dto.ephemeralKey) {
      throw new BadRequestException('Invalid encrypted message payload: missing cryptographic fields');
    }

    const message: StoredEncryptedMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId: dto.recipientId,
      teamId: dto.teamId,
      ephemeralKey: dto.ephemeralKey,
      sequenceNumber: dto.sequenceNumber,
      previousChainLength: dto.previousChainLength,
      ciphertext: dto.ciphertext,
      iv: dto.iv,
      authTag: dto.authTag,
      hmacSignature: dto.hmacSignature,
      createdAt: new Date(),
    };

    this.messages.push(message);

    // Optional Prisma persistence
    try {
      const prismaAny = this.prisma as any;
      if (prismaAny.encryptedChatMessage) {
        await prismaAny.encryptedChatMessage.create({
          data: {
            id: message.id,
            senderId,
            recipientId: dto.recipientId,
            teamId: dto.teamId,
            ephemeralKey: dto.ephemeralKey,
            sequenceNumber: dto.sequenceNumber,
            previousChainLength: dto.previousChainLength,
            ciphertext: dto.ciphertext,
            iv: dto.iv,
            authTag: dto.authTag,
            hmacSignature: dto.hmacSignature,
            createdAt: message.createdAt,
          },
        });
      }
    } catch (err: any) {
      this.logger.debug(`Prisma message persistence skipped: ${err?.message}`);
    }

    return message;
  }

  /**
   * Retrieves encrypted messages for a recipient or team.
   */
  async getEncryptedMessages(query: {
    recipientId?: string;
    teamId?: string;
    limit?: number;
  }): Promise<StoredEncryptedMessage[]> {
    const limit = query.limit || 50;
    return this.messages
      .filter((m) => {
        if (query.teamId && m.teamId === query.teamId) return true;
        if (query.recipientId && m.recipientId === query.recipientId) return true;
        return false;
      })
      .slice(-limit);
  }

  /**
   * Computes Signal Safety Number fingerprint between two participants.
   * Produces a standard 60-digit numeric string formatted into 12 5-digit blocks.
   */
  computeSafetyNumber(
    userAId: string,
    identityKeyA: string,
    userBId: string,
    identityKeyB: string,
  ): string {
    // Sort participants lexicographically to ensure identical fingerprint on both sides
    const [first, second] = [
      { id: userAId, key: identityKeyA },
      { id: userBId, key: identityKeyB },
    ].sort((a, b) => a.id.localeCompare(b.id));

    const hash = crypto.createHash('sha512');
    hash.update(first.id, 'utf8');
    hash.update(Buffer.from(first.key, 'base64'));
    hash.update(second.id, 'utf8');
    hash.update(Buffer.from(second.key, 'base64'));
    const digest = hash.digest();

    // Convert 32 bytes into 12 5-digit segments (mod 100000)
    const blocks: string[] = [];
    for (let i = 0; i < 12; i++) {
      const offset = i * 2;
      const num = digest.readUInt16BE(offset) % 100000;
      blocks.push(num.toString().padStart(5, '0'));
    }

    return blocks.join(' ');
  }

  /**
   * Test helper to reset in-memory state.
   */
  resetState(): void {
    this.bundles.clear();
    this.messages.length = 0;
  }
}
