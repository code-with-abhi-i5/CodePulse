/**
 * Architecture Service: Rate-Limited Magic Link Login Provider
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-41]
 */

import crypto from 'node:crypto';

export interface MagicLinkToken {
  token: string;
  email: string;
  nonce: string;
  expiresAt: number;
  consumed: boolean;
}

export class MagicLinkAuthenticationProviderService {
  private secretKey: string;
  private tokenTtlMs: number;
  private maxRequestsPerHour: number;
  private tokens: Map<string, MagicLinkToken>;
  private rateLimitMap: Map<string, number[]>;

  constructor(secretKey: string = 'magic-link-secret-key-32-chars-long!', tokenTtlMs: number = 900000, maxRequestsPerHour: number = 5) {
    this.secretKey = secretKey;
    this.tokenTtlMs = tokenTtlMs;
    this.maxRequestsPerHour = maxRequestsPerHour;
    this.tokens = new Map<string, MagicLinkToken>();
    this.rateLimitMap = new Map<string, number[]>();
  }

  public requestMagicLink(email: string): { success: boolean; token?: string; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const timestamps = (this.rateLimitMap.get(normalizedEmail) || []).filter(ts => now - ts < 3600000);

    if (timestamps.length >= this.maxRequestsPerHour) {
      return { success: false, error: 'Rate limit exceeded for magic link requests' };
    }

    timestamps.push(now);
    this.rateLimitMap.set(normalizedEmail, timestamps);

    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = now + this.tokenTtlMs;
    const signature = crypto.createHmac('sha256', this.secretKey)
      .update(`${normalizedEmail}:${nonce}:${expiresAt}`)
      .digest('hex');

    const token = `${nonce}.${expiresAt}.${signature}`;
    this.tokens.set(token, {
      token,
      email: normalizedEmail,
      nonce,
      expiresAt,
      consumed: false
    });

    return { success: true, token };
  }

  public verifyAndConsume(email: string, token: string): { valid: boolean; email?: string; error?: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.tokens.get(token);

    if (!record) {
      return { valid: false, error: 'Token not found or invalid' };
    }

    if (record.consumed) {
      return { valid: false, error: 'Token has already been consumed' };
    }

    if (record.email !== normalizedEmail) {
      return { valid: false, error: 'Token email mismatch' };
    }

    if (Date.now() > record.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [nonce, expiresAtStr, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', this.secretKey)
      .update(`${normalizedEmail}:${nonce}:${expiresAtStr}`)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig)) === false) {
      return { valid: false, error: 'Cryptographic signature invalid' };
    }

    record.consumed = true;
    return { valid: true, email: normalizedEmail };
  }
}
