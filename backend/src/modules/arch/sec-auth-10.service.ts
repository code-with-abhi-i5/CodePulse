/**
 * Architecture Service: PII Dynamic Masking Interceptor for Logs & Traces
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-10]
 */

export class PiiDynamicMaskingInterceptorService {
  private sensitiveKeyPatterns: RegExp[];

  constructor() {
    this.sensitiveKeyPatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /authorization/i,
      /apiKey/i,
      /ssn/i,
      /creditCard/i
    ];
  }

  public maskObject<T>(input: T): T {
    if (input === null || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.maskObject(item)) as unknown as T;
    }

    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (this.isSensitiveKey(key)) {
        output[key] = '***MASKED***';
      } else if (typeof value === 'object' && value !== null) {
        output[key] = this.maskObject(value);
      } else if (typeof value === 'string' && this.isEmail(value)) {
        output[key] = this.maskEmail(value);
      } else {
        output[key] = value;
      }
    }

    return output as T;
  }

  private isSensitiveKey(key: string): boolean {
    return this.sensitiveKeyPatterns.some((p) => p.test(key));
  }

  private isEmail(str: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `***@${domain}`;
    return `${user.charAt(0)}***${user.charAt(user.length - 1)}@${domain}`;
  }
}
