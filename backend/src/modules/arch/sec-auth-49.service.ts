/**
 * Architecture Service: API Payload Desanitization Guard
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-49]
 */

export class ApiPayloadDesanitizationGuardService {
  private forbiddenKeys: Set<string> = new Set(['__proto__', 'constructor', 'prototype']);

  public sanitizeAndValidatePayload(payload: any, maxDepth: number = 5): { safe: boolean; sanitizedPayload?: any; error?: string } {
    try {
      const sanitized = this.deepSanitize(payload, 0, maxDepth);
      return { safe: true, sanitizedPayload: sanitized };
    } catch (err: any) {
      return { safe: false, error: err.message };
    }
  }

  private deepSanitize(val: any, currentDepth: number, maxDepth: number): any {
    if (currentDepth > maxDepth) {
      throw new Error('Payload nesting exceeds maximum allowable depth');
    }

    if (val === null || typeof val !== 'object') {
      if (typeof val === 'string') {
        // Strip dangerous script tags or null bytes
        return val.replace(/\0/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      return val;
    }

    if (Array.isArray(val)) {
      return val.map(item => this.deepSanitize(item, currentDepth + 1, maxDepth));
    }

    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      if (this.forbiddenKeys.has(key)) {
        throw new Error(`Prototype pollution attempt detected with key '${key}'`);
      }
      cleanObj[key] = this.deepSanitize(val[key], currentDepth + 1, maxDepth);
    }

    return cleanObj;
  }
}
