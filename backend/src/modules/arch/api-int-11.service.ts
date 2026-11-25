/**
 * Architecture Service: API Gateway Request Payload Prototype Pollution Sanitizer
 * Subsystem: API Security & Ingress Hardening
 */

export class ApiPayloadSanitizerService {
  private readonly forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);

  public sanitize<T>(input: T): T {
    if (input === null || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitize(item)) as unknown as T;
    }

    const cleanObj: Record<string, unknown> = Object.create(null);
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (this.forbiddenKeys.has(key)) {
        continue; // Strip prototype pollution keys
      }
      cleanObj[key] = this.sanitize(value);
    }

    return cleanObj as T;
  }

  public hasPollutionThreat(input: unknown): boolean {
    if (input === null || typeof input !== 'object') return false;
    for (const key of Object.keys(input as Record<string, unknown>)) {
      if (this.forbiddenKeys.has(key)) return true;
      if (typeof (input as Record<string, unknown>)[key] === 'object' && this.hasPollutionThreat((input as Record<string, unknown>)[key])) {
        return true;
      }
    }
    return false;
  }
}
