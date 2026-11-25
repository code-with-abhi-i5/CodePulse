/**
 * Architecture Service: Open Redirect Vulnerability Mitigator
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-36]
 */

export class OpenRedirectMitigatorService {
  private trustedDomains: string[];

  constructor(trustedDomains: string[] = ['codepulse.io', 'app.codepulse.io']) {
    this.trustedDomains = trustedDomains;
  }

  public sanitizeRedirectUrl(returnTo: string, fallbackUrl: string = '/dashboard'): string {
    if (!returnTo || typeof returnTo !== 'string') return fallbackUrl;

    const trimmed = returnTo.trim();

    // Protocol-relative URL bypass (e.g. //evil.com) -> reject
    if (trimmed.startsWith('//')) {
      return fallbackUrl;
    }

    // Relative paths (e.g. /settings, /battles/123) are safe, reject / or //
    if (trimmed.startsWith('/') && trimmed.charCodeAt(1) !== 92) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      if (this.trustedDomains.includes(parsed.hostname)) {
        return trimmed;
      }
    } catch {
      return fallbackUrl;
    }

    return fallbackUrl;
  }
}
