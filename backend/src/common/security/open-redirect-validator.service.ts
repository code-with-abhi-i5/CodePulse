import { RedirectValidationResult } from '../../types/security';

export class OpenRedirectValidatorService {
  constructor(private readonly allowedHosts: string[] = ['codepulse.io', 'app.codepulse.io', 'auth.codepulse.io']) {}

  public validateRedirectUrl(targetUrl: string, defaultFallback: string = '/dashboard'): RedirectValidationResult {
    // Protocol-relative URL check: e.g. "//evil.com"
    if (targetUrl.startsWith('//') || targetUrl.startsWith('\\\\')) {
      return {
        isSafe: false,
        sanitizedUrl: defaultFallback,
        reason: 'Protocol-relative URL is not permitted'
      };
    }

    // Relative paths are safe
    if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
      return {
        isSafe: true,
        sanitizedUrl: targetUrl
      };
    }

    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          isSafe: false,
          sanitizedUrl: defaultFallback,
          reason: `Protocol "${parsed.protocol}" is not permitted`
        };
      }

      if (!this.allowedHosts.includes(parsed.hostname.toLowerCase())) {
        return {
          isSafe: false,
          sanitizedUrl: defaultFallback,
          reason: `Host "${parsed.hostname}" is not in open redirect allowlist`
        };
      }

      return {
        isSafe: true,
        sanitizedUrl: targetUrl
      };
    } catch {
      return {
        isSafe: false,
        sanitizedUrl: defaultFallback,
        reason: 'Malformed redirect URL'
      };
    }
  }
}
