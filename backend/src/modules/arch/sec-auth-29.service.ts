/**
 * Architecture Service: Email Verification Token Manager
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-29]
 */

import crypto from 'node:crypto';

export class EmailVerificationTokenManagerService {
  private tokenStore: Map<string, { tokenHash: string; expiresAt: number }>;
  private ttlMs: number;

  constructor(ttlMs: number = 900000) { // 15 mins TTL
    this.tokenStore = new Map();
    this.ttlMs = ttlMs;
  }

  public createVerificationToken(userId: string): string {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.tokenStore.set(userId, {
      tokenHash,
      expiresAt: Date.now() + this.ttlMs
    });

    return rawToken;
  }

  public verifyToken(userId: string, rawToken: string): boolean {
    const record = this.tokenStore.get(userId);
    if (!record || Date.now() > record.expiresAt) return false;

    const inputHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.tokenHash))) {
      this.tokenStore.delete(userId);
      return true;
    }

    return false;
  }
}
