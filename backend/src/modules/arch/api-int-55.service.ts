/**
 * Architecture Service: Dynamic CORS Origin Validator
 * Subsystem: Web Security & Cross-Origin Control
 */

export class ApiCorsDynamicOriginValidatorService {
  private readonly allowedOriginPatterns: RegExp[] = [];

  public addAllowedPattern(pattern: RegExp): void {
    this.allowedOriginPatterns.push(pattern);
  }

  public isOriginAllowed(origin: string): boolean {
    if (!origin) return false;
    return this.allowedOriginPatterns.some(pattern => pattern.test(origin));
  }
}
