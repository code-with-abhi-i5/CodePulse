import { XssSanitizationResult } from '../../types/security';

export class XssAstSanitizerService {
  private readonly dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /\bon\w+\s*=/gi, // onerror=, onload=
    /eval\s*\(/gi,
    /document\.cookie/gi
  ];

  public sanitizeCode(input: string): XssSanitizationResult {
    const detectedThreats: string[] = [];
    let sanitizedCode = input;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(input)) {
        detectedThreats.push(pattern.source);
        sanitizedCode = sanitizedCode.replace(pattern, '/* BLOCKED_XSS */');
      }
    }

    return {
      isClean: detectedThreats.length === 0,
      detectedThreats,
      sanitizedCode
    };
  }
}
