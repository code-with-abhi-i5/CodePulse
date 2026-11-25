/**
 * Architecture Service: Webhook Signature Rotating Keys with Dual-Active Window
 * Subsystem: API Communication Protocols & Ingress Management [API-INT-62]
 */

import crypto from 'node:crypto';

export interface SecretKeyInfo {
  keyId: string;
  secret: string;
  createdAt: number;
  expiresAt: number;
  status: 'primary' | 'previous' | 'retired';
}

export class WebhookSignatureRotationService {
  private keys: Map<string, SecretKeyInfo>;

  constructor() {
    this.keys = new Map();
  }

  public addKey(keyId: string, secret: string, status: 'primary' | 'previous', ttlMs: number = 86400000): void {
    const now = Date.now();
    this.keys.set(keyId, {
      keyId,
      secret,
      createdAt: now,
      expiresAt: now + ttlMs,
      status
    });
  }

  public signPayload(payload: string): { keyId: string; signature: string; timestamp: number } {
    let primaryKey: SecretKeyInfo | null = null;
    for (const key of this.keys.values()) {
      if (key.status === 'primary' && Date.now() < key.expiresAt) {
        primaryKey = key;
        break;
      }
    }

    if (!primaryKey) {
      throw new Error('No valid primary secret key configured for signing');
    }

    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', primaryKey.secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return { keyId: primaryKey.keyId, signature, timestamp };
  }

  public verifyPayload(payload: string, keyId: string, signature: string, timestamp: number, maxDriftMs: number = 300000): boolean {
    const key = this.keys.get(keyId);
    if (!key || key.status === 'retired' || Date.now() > key.expiresAt) {
      return false;
    }

    if (Math.abs(Date.now() - timestamp) > maxDriftMs) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', key.secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  }

  public rotateKey(newKeyId: string, newSecret: string, previousGracePeriodMs: number = 86400000): void {
    for (const key of this.keys.values()) {
      if (key.status === 'primary') {
        key.status = 'previous';
        key.expiresAt = Date.now() + previousGracePeriodMs;
      }
    }
    this.addKey(newKeyId, newSecret, 'primary', previousGracePeriodMs * 7);
  }
}
