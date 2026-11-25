/**
 * Architecture Service: SSRF Egress Firewall & Private Subnet Guard
 * Subsystem: Identity, Authentication & Cryptographic Security [SEC-AUTH-34]
 */

export class SsrfEgressFirewallService {
  public isPrivateIp(ip: string): boolean {
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') return true;

    // IPv4 private ranges (RFC 1918, RFC 3927 link-local, loopback)
    const parts = ip.split('.').map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      if (parts[0] === 10) return true; // 10.0.0.0/8
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16.0.0/12
      if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.0.0/16
      if (parts[0] === 127) return true; // 127.0.0.0/8 loopback
      if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.0.0/16 link-local/cloud metadata
      if (parts[0] === 0) return true; // 0.0.0.0/8
    }

    return false;
  }

  public validateTargetUrl(targetUrl: string): { isSafe: boolean; error?: string } {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isSafe: false, error: 'SSRF blocked: protocol must be HTTP or HTTPS' };
      }

      if (this.isPrivateIp(parsed.hostname)) {
        return { isSafe: false, error: `SSRF blocked: Host '${parsed.hostname}' resolves to private/internal subnet` };
      }

      return { isSafe: true };
    } catch {
      return { isSafe: false, error: 'Malformed URL provided' };
    }
  }
}
