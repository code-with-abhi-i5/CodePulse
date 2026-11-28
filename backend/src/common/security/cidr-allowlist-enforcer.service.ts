import { CidrEvaluationResult } from '../../types/security';

export class CidrAllowlistEnforcerService {
  constructor(private readonly allowedCidrs: string[] = ['10.0.0.0/8', '192.168.1.0/24']) {}

  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  public isIpInCidr(ip: string, cidr: string): boolean {
    const [range, bits = '32'] = cidr.split('/');
    const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1);
    return (this.ipToInt(ip) & mask) === (this.ipToInt(range) & mask);
  }

  public evaluateClientIp(clientIp: string): CidrEvaluationResult {
    for (const cidr of this.allowedCidrs) {
      if (this.isIpInCidr(clientIp, cidr)) {
        return {
          isAllowed: true,
          clientIp,
          matchedCidr: cidr
        };
      }
    }

    return {
      isAllowed: false,
      clientIp,
      reason: `IP "${clientIp}" does not match configured corporate CIDR allowlist`
    };
  }
}
