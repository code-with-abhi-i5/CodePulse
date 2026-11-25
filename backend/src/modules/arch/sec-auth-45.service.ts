/**
 * Architecture Service: Reverse Proxy Header Spoofing Guard
 * Subsystem: Enterprise Authentication & Cryptography [SEC-AUTH-45]
 */

export class ReverseProxyHeaderSpoofingGuardService {
  private trustedProxies: Set<string>;

  constructor(trustedProxies: string[] = ['10.0.0.1', '10.0.0.2', '127.0.0.1']) {
    this.trustedProxies = new Set(trustedProxies);
  }

  public resolveClientIp(
    socketRemoteAddress: string,
    headers: Record<string, string | string[] | undefined>
  ): { resolvedClientIp: string; spoofingDetected: boolean } {
    const rawForwarded = headers['x-forwarded-for'];
    const forwardedHeader = Array.isArray(rawForwarded) ? rawForwarded[0] : rawForwarded;

    // If request does NOT come directly from a trusted reverse proxy, ignore client-provided headers
    if (!this.trustedProxies.has(socketRemoteAddress)) {
      const spoofingDetected = Boolean(forwardedHeader && forwardedHeader.trim().length > 0);
      return {
        resolvedClientIp: socketRemoteAddress,
        spoofingDetected
      };
    }

    // From trusted proxy: parse chain and take first untrusted client IP from the right
    if (!forwardedHeader) {
      return { resolvedClientIp: socketRemoteAddress, spoofingDetected: false };
    }

    const chain = forwardedHeader.split(',').map(ip => ip.trim()).filter(Boolean);
    if (chain.length === 0) {
      return { resolvedClientIp: socketRemoteAddress, spoofingDetected: false };
    }

    // Traverse chain from right to left
    let clientIp = chain[0];
    for (let i = chain.length - 1; i >= 0; i--) {
      if (!this.trustedProxies.has(chain[i])) {
        clientIp = chain[i];
        break;
      }
    }

    return { resolvedClientIp: clientIp, spoofingDetected: false };
  }
}
