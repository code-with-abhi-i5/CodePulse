import test from 'node:test';
import assert from 'node:assert/strict';

class CidrAllowlistEnforcer {
  ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  isIpInCidr(ip, cidr) {
    const [range, bitsStr] = cidr.split('/');
    const bits = bitsStr ? parseInt(bitsStr, 10) : 32;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    const ipInt = this.ipToInt(ip);
    const rangeInt = this.ipToInt(range);
    return (ipInt & mask) === (rangeInt & mask);
  }

  evaluateRequest(clientIp, allowlist) {
    if (!allowlist || allowlist.length === 0) {
      return { allowed: true };
    }
    const matched = allowlist.some(rule => this.isIpInCidr(clientIp, rule.cidr));
    if (matched) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Client IP ${clientIp} not in tenant allowlist` };
  }
}

test('CidrAllowlistEnforcer - accurately matches IPv4 addresses against CIDR subnets', () => {
  const enforcer = new CidrAllowlistEnforcer();
  const rules = [{ cidr: '10.0.0.0/16' }, { cidr: '192.168.1.5/32' }];

  assert.strictEqual(enforcer.evaluateRequest('10.0.5.23', rules).allowed, true);
  assert.strictEqual(enforcer.evaluateRequest('192.168.1.5', rules).allowed, true);
  assert.strictEqual(enforcer.evaluateRequest('192.168.1.6', rules).allowed, false);
  assert.strictEqual(enforcer.evaluateRequest('8.8.8.8', rules).allowed, false);
});
