import crypto from 'crypto';
import { WebhookPayload, WebhookDeliveryResult } from '../../types/tenancy';

export class ReliableWebhookDispatcher {
  private secret: string;

  constructor(secret: string = 'whsec_enterprise_secret') {
    this.secret = secret;
  }

  generateHmacSignature(payload: string): string {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  computeBackoffDelay(attempt: number, baseMs: number = 100): number {
    return Math.min(baseMs * Math.pow(2, attempt - 1), 5000);
  }

  simulateDispatch(endpoint: string, payload: WebhookPayload, mockFails: number = 0): WebhookDeliveryResult {
    const raw = JSON.stringify(payload);
    const signature = this.generateHmacSignature(raw);
    let attempts = 0;
    while (attempts <= mockFails && attempts < 3) {
      attempts++;
    }
    const delivered = attempts > mockFails;
    return {
      endpoint,
      attempts,
      statusCode: delivered ? 200 : 500,
      signature: `sha256=${signature}`,
      delivered
    };
  }
}
