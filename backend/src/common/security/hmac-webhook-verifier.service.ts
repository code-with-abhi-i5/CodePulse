import crypto from 'node:crypto';
import { HmacVerificationResult } from '../../types/security';

export class HmacWebhookVerifierService {
  constructor(
    private readonly signingSecret: string = 'webhook-hmac-signing-secret',
    private readonly maxDriftMs: number = 300000 // 5 minutes
  ) {}

  public signPayload(payloadString: string, timestamp: number = Date.now()): string {
    const signature = crypto.createHmac('sha256', this.signingSecret).update(`${timestamp}.${payloadString}`).digest('hex');
    return `t=${timestamp},v1=${signature}`;
  }

  public verifyHeader(headerValue: string, payloadString: string, now: number = Date.now()): HmacVerificationResult {
    const match = headerValue.match(/t=(\d+),v1=([a-f0-9]+)/);
    if (!match) {
      return { isValid: false, timestampDriftMs: 0, reason: 'Malformed signature header format' };
    }

    const timestamp = parseInt(match[1], 10);
    const signature = match[2];
    const timestampDriftMs = Math.abs(now - timestamp);

    if (timestampDriftMs > this.maxDriftMs) {
      return { isValid: false, timestampDriftMs, reason: 'Timestamp drift exceeds tolerance' };
    }

    const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(`${timestamp}.${payloadString}`).digest('hex');
    const isValid = signature.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));

    return {
      isValid,
      timestampDriftMs,
      reason: isValid ? undefined : 'HMAC signature mismatch'
    };
  }
}
