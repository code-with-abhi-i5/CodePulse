import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ReverseProxyHeaderSpoofingGuardService } from './sec-auth-45.service.ts';

describe('ReverseProxyHeaderSpoofingGuardService (SEC-AUTH-45)', () => {
  it('strips untrusted X-Forwarded-For when connection is from public client directly', () => {
    const guard = new ReverseProxyHeaderSpoofingGuardService(['10.0.0.1']);
    const attackerIp = '198.51.100.5';

    const res = guard.resolveClientIp(attackerIp, {
      'x-forwarded-for': '8.8.8.8, 1.1.1.1'
    });

    assert.strictEqual(res.resolvedClientIp, attackerIp);
    assert.strictEqual(res.spoofingDetected, true);
  });

  it('honors forwarded IP chain when connection arrives from a verified trusted proxy', () => {
    const guard = new ReverseProxyHeaderSpoofingGuardService(['10.0.0.1']);
    const proxyIp = '10.0.0.1';

    const res = guard.resolveClientIp(proxyIp, {
      'x-forwarded-for': '203.0.113.195, 10.0.0.1'
    });

    assert.strictEqual(res.resolvedClientIp, '203.0.113.195');
    assert.strictEqual(res.spoofingDetected, false);
  });
});
