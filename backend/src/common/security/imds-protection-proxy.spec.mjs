import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class ImdsProtectionProxyService {
  inspectUrl(targetUrl) {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'INVALID_URL',
        reason: 'Malformed URL could not be parsed'
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === '169.254.169.254' ||
      hostname.includes('169.254') ||
      hostname === '2852039166' ||
      hostname === '0xa9fea9fe' ||
      hostname === 'fd00:ec2::254'
    ) {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'IMDS_ACCESS',
        reason: 'Blocked cloud instance metadata service (IMDS) probe'
      };
    }

    if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') {
      return {
        isSafe: false,
        targetUrl,
        detectedThreat: 'LOCALHOST_PROBE',
        reason: 'Blocked internal localhost loopback probe'
      };
    }

    return {
      isSafe: true,
      targetUrl
    };
  }
}

describe('ImdsProtectionProxyService', () => {
  const proxy = new ImdsProtectionProxyService();

  it('blocks cloud metadata endpoint probes (IPv4, hex, and decimal notations)', () => {
    assert.equal(proxy.inspectUrl('http://169.254.169.254/latest/meta-data').isSafe, false);
    assert.equal(proxy.inspectUrl('http://0xa9fea9fe/latest/meta-data').isSafe, false);
    assert.equal(proxy.inspectUrl('http://2852039166/latest/meta-data').isSafe, false);
  });

  it('blocks localhost and loopback probes', () => {
    assert.equal(proxy.inspectUrl('http://localhost:8080/admin').isSafe, false);
    assert.equal(proxy.inspectUrl('http://127.0.0.1:3000/metrics').isSafe, false);
  });

  it('allows safe public external webhook endpoints', () => {
    const res = proxy.inspectUrl('https://api.github.com/repos');
    assert.equal(res.isSafe, true);
  });
});
