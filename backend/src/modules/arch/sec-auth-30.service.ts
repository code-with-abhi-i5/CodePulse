/**
 * Architecture Service: CORS Origin Strict Regex Validator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-30]
 */

export class CorsOriginRegexValidatorService {
  private allowedRegex: RegExp;

  constructor(allowedRegexPattern: string = '^https://([a-zA-Z0-9-]+\\.)?codepulse\\.io$') {
    this.allowedRegex = new RegExp(allowedRegexPattern);
  }

  public validateOrigin(origin: string): boolean {
    if (!origin) return false;
    return this.allowedRegex.test(origin);
  }
}
