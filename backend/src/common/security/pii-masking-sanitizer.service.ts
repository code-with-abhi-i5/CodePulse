import { PiiMaskingResult } from '../../types/security';

export class PiiMaskingSanitizerService {
  private readonly patterns = [
    { type: 'CREDIT_CARD', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, mask: '[REDACTED_CC]' },
    { type: 'PASSWORD_FIELD', regex: /"password"\s*:\s*"[^"]+"/gi, mask: '"password": "[REDACTED_PASSWORD]"' },
    { type: 'AUTH_TOKEN', regex: /Bearer\s+[a-zA-Z0-9_.-]{16,}/gi, mask: 'Bearer [REDACTED_TOKEN]' },
    { type: 'EMAIL', regex: /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, mask: '[REDACTED_EMAIL]' }
  ];

  public sanitize(text: string): PiiMaskingResult {
    let sanitized = text;
    let redactedCount = 0;
    const typesRedacted: string[] = [];

    for (const p of this.patterns) {
      const matches = sanitized.match(p.regex);
      if (matches) {
        redactedCount += matches.length;
        typesRedacted.push(p.type);
        sanitized = sanitized.replace(p.regex, p.mask);
      }
    }

    return {
      sanitized,
      redactedCount,
      typesRedacted
    };
  }
}
