import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class CidrAllowlistEnforcerService {
  constructor(allowedCidrs = ['10.0.0.0/8', '192.168.1.0/24']) {
    this.allowedCidrs = allowedCidrs;
  }

  ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  isIpInCidr(ip, cidr) {
    const [range, bits = '32'] = cidr.split('/');
    const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1);
    return (this.ipToInt(ip) & mask) === (this.ipToInt(range) & mask);
  }

  evaluateClientIp(clientIp) {
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
      reason: 'IP "' + clientIp + '" does not match configured corporate CIDR allowlist'
    };
  }
}

describe('CidrAllowlistEnforcerService', () => {
  const enforcer = new CidrAllowlistEnforcerService(['10.0.0.0/8', '192.168.1.0/24']);

  it('approves IPs within allowed corporate subnet ranges', () => {
    const resA = enforcer.evaluateClientIp('10.50.1.100');
    assert.equal(resA.isAllowed, true);
    assert.equal(resA.matchedCidr, '10.0.0.0/8');

    const resB = enforcer.evaluateClientIp('192.168.1.42');
    assert.equal(resB.isAllowed, true);
    assert.equal(resB.matchedCidr, '192.168.1.0/24');
  });

  it('rejects external IPs outside allowed CIDR subnets', () => {
    const resDenied = enforcer.evaluateClientIp('203.0.113.50');
    assert.equal(resDenied.isAllowed, false);
    assert.ok(resDenied.reason.includes('does not match configured corporate CIDR'));
  });
});
