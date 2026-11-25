/**
 * Architecture Service: HSTS & Hardened Security Response Headers
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-25]
 */

export class SecurityHeadersEnforcementService {
  public getHardenedHeaders(maxAgeSeconds: number = 63072000): Record<string, string> {
    return {
      'Strict-Transport-Security': `max-age=${maxAgeSeconds}; includeSubDomains; preload`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin'
    };
  }
}
