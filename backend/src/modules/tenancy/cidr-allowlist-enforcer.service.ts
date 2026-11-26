import { CidrRule } from '../../types/tenancy';

export class CidrAllowlistEnforcer {
  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  isIpInCidr(ip: string, cidr: string): boolean {
    const [range, bitsStr] = cidr.split('/');
    const bits = bitsStr ? parseInt(bitsStr, 10) : 32;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const ipInt = this.ipToInt(ip);
    const rangeInt = this.ipToInt(range);
    return (ipInt & mask) === (rangeInt & mask);
  }

  evaluateRequest(clientIp: string, allowlist: CidrRule[]): { allowed: boolean; reason?: string } {
    if (!allowlist || allowlist.length === 0) {
      return { allowed: true }; // No restrictions if allowlist is empty
    }
    const matched = allowlist.some(rule => this.isIpInCidr(clientIp, rule.cidr));
    if (matched) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Client IP ${clientIp} not in tenant allowlist` };
  }
}
