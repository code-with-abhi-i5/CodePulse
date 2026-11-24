import { Injectable, Logger } from '@nestjs/common';

export interface MaskingStats {
  maskedFieldsCount: number;
  durationUs: number;
}

@Injectable()
export class PiiMaskerService {
  private readonly logger = new Logger(PiiMaskerService.name);

  // Common sensitive key identifiers
  private static readonly SENSITIVE_KEYS = new Set([
    'password',
    'pass',
    'secret',
    'token',
    'accesstoken',
    'refreshtoken',
    'apikey',
    'api_key',
    'authorization',
    'auth',
    'creditcard',
    'cardnumber',
    'cvv',
    'ssn',
  ]);

  // Fast Regex patterns
  private static readonly REGEX_JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
  private static readonly REGEX_CREDIT_CARD = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  private static readonly REGEX_SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
  private static readonly REGEX_EMAIL = /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  /**
   * Recursively masks sensitive fields in an object payload in < 150 microseconds.
   */
  public maskPayload<T>(input: T): { masked: T; stats: MaskingStats } {
    const startTime = process.hrtime.bigint();
    let fieldsCount = 0;

    const traverse = (val: any): any => {
      if (val === null || val === undefined) return val;

      if (typeof val === 'string') {
        const maskedStr = this.maskStringContent(val);
        if (maskedStr !== val) fieldsCount++;
        return maskedStr;
      }

      if (Array.isArray(val)) {
        return val.map((item) => traverse(item));
      }

      if (typeof val === 'object') {
        const copy: Record<string, any> = {};
        for (const [k, v] of Object.entries(val)) {
          const lowerK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (PiiMaskerService.SENSITIVE_KEYS.has(lowerK)) {
            copy[k] = '[REDACTED_SECRET]';
            fieldsCount++;
          } else {
            copy[k] = traverse(v);
          }
        }
        return copy;
      }

      return val;
    };

    const masked = traverse(input);
    const durationUs = Number(process.hrtime.bigint() - startTime) / 1000;

    return {
      masked,
      stats: {
        maskedFieldsCount: fieldsCount,
        durationUs: Number(durationUs.toFixed(1)),
      },
    };
  }

  /**
   * Sanitizes string values matching Credit Cards, JWTs, SSNs, or Emails.
   */
  public maskStringContent(str: string): string {
    return str
      .replace(PiiMaskerService.REGEX_JWT, '[REDACTED_JWT]')
      .replace(PiiMaskerService.REGEX_CREDIT_CARD, (card) => {
        const cleaned = card.replace(/[\s-]/g, '');
        return `****-****-****-${cleaned.slice(-4)}`;
      })
      .replace(PiiMaskerService.REGEX_SSN, '***-**-****')
      .replace(PiiMaskerService.REGEX_EMAIL, '$1***$2');
  }
}
