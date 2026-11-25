/**
 * Architecture Service: GitHub App Integration Webhook Listener
 * Subsystem: Webhook Ingress & Deduplication
 */

import crypto from 'node:crypto';

export interface WebhookDeliveryResult {
  accepted: boolean;
  duplicate: boolean;
  reason?: string;
}

export class GithubAppWebhookListenerService {
  private readonly secret: string;
  private readonly processedDeliveries = new Set<string>();

  constructor(secret = 'github-app-secret-123') {
    this.secret = secret;
  }

  public verifySignature(payload: string, signatureHeader: string): boolean {
    if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
      return false;
    }
    const signature = signatureHeader.slice(7);
    const expected = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  public processWebhook(deliveryId: string, payload: string, signature: string): WebhookDeliveryResult {
    if (!this.verifySignature(payload, signature)) {
      return { accepted: false, duplicate: false, reason: 'Invalid signature' };
    }
    if (this.processedDeliveries.has(deliveryId)) {
      return { accepted: false, duplicate: true, reason: 'Duplicate delivery ID' };
    }
    this.processedDeliveries.add(deliveryId);
    return { accepted: true, duplicate: false };
  }
}
