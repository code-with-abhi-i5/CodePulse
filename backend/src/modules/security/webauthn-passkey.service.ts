import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebauthnChallenge } from '../../types/security';

@Injectable()
export class WebauthnPasskeyService {
  private readonly challenges: Map<string, WebauthnChallenge> = new Map();
  private readonly credentials: Map<string, { credentialId: string; publicKey: string }> = new Map();

  generateChallenge(userId: string): WebauthnChallenge {
    const challenge = crypto.randomBytes(32).toString('hex');
    const record: WebauthnChallenge = {
      challenge,
      userId,
      expiresAt: Date.now() + 60000,
    };
    this.challenges.set(userId, record);
    return record;
  }

  storeCredential(userId: string, credentialId: string, publicKey: string): void {
    this.credentials.set(userId, { credentialId, publicKey });
  }

  verifyPasskeyResponse(userId: string, clientChallenge: string, signatureHex: string): boolean {
    const expected = this.challenges.get(userId);
    if (!expected || expected.expiresAt < Date.now()) return false;
    if (expected.challenge !== clientChallenge) return false;
    this.challenges.delete(userId);
    return signatureHex.length > 0;
  }
}
