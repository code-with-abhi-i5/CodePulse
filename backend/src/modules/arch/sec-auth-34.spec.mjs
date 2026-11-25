import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SsrfEgressFirewallService } from './sec-auth-34.service.ts';

describe('SsrfEgressFirewallService (SEC-AUTH-34)', () => {
  it('blocks private IP addresses, cloud metadata (169.254.169.254), and loopbacks', () => {
    const firewall = new SsrfEgressFirewallService();

    assert.strictEqual(firewall.validateTargetUrl('http://169.254.169.254/latest/meta-data').isSafe, false);
    assert.strictEqual(firewall.validateTargetUrl('http://127.0.0.1:8080/admin').isSafe, false);
    assert.strictEqual(firewall.validateTargetUrl('http://10.0.1.5/internal').isSafe, false);
    assert.strictEqual(firewall.validateTargetUrl('http://192.168.1.1').isSafe, false);

    assert.strictEqual(firewall.validateTargetUrl('https://api.github.com/webhook').isSafe, true);
  });
});
