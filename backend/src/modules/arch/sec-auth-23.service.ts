/**
 * Architecture Service: Rate-Limited Password Reset Token Manager
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-23]
 */

import crypto from 'node:crypto';

export class PasswordResetTokenManagerService {
  private activeTokens: Map<string, { email: string; tokenHash: string; expiresAt: number }>;
  private requestCooldowns: Map<string, number>;
  private tokenTtlMs: number;

  constructor(tokenTtlMs: number = 900000, cooldownMs: number = 60000) { // 15 mins TTL, 1 min cooldown
    this.activeTokens = new Map();
    this.requestCooldowns = new Map();
    this.tokenTtlMs = tokenTtlMs;
  }

  public createResetToken(email: string): { rawToken: string } {
    const now = Date.now();
    const lastRequest = this.requestCooldowns.get(email) || 0;
    if (now - lastRequest < 60000) {
      throw new Error('Rate limit exceeded: Please wait before requesting another reset email');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    this.activeTokens.set(email, {
      email,
      tokenHash,
      expiresAt: now + this.tokenTtlMs
    });
    this.requestCooldowns.set(email, now);

    return { rawToken };
  }

  public verifyAndConsumeToken(email: string, rawToken: string): boolean {
    const record = this.activeTokens.get(email);
    if (!record || Date.now() > record.expiresAt) {
      return false;
    }

    const inputHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.tokenHash))) {
      // Single-use: consume immediately
      this.activeTokens.delete(email);
      return true;
    }

    return false;
  }
}
