/**
 * Architecture Service: Webhook Delivery Payload Masking
 * Subsystem: Security & Sensitive Credential Redaction
 */

export class WebhookPayloadMaskingService {
  private readonly sensitivePatterns = [
    /secret/i,
    /password/i,
    /token/i,
    /apikey/i,
    /authorization/i
  ];

  public mask<T>(input: T): T {
    if (input === null || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.mask(item)) as unknown as T;
    }

    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const isSensitive = this.sensitivePatterns.some(pattern => pattern.test(key));
      if (isSensitive) {
        masked[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.mask(value);
      } else {
        masked[key] = value;
      }
    }
    return masked as T;
  }
}
