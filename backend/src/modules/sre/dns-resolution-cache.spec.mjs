import test from 'node:test';
import assert from 'node:assert/strict';

class DnsResolutionCache {
  constructor(defaultPositiveTtlMs = 300000, defaultNegativeTtlMs = 30000) {
    this.cache = new Map();
    this.defaultPositiveTtlMs = defaultPositiveTtlMs;
    this.defaultNegativeTtlMs = defaultNegativeTtlMs;
  }

  setPositive(hostname, address, customTtlMs) {
    const ttl = customTtlMs || this.defaultPositiveTtlMs;
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      address,
      isNegative: false,
      expiresAt: Date.now() + ttl
    });
  }

  setNegative(hostname, customTtlMs) {
    const ttl = customTtlMs || this.defaultNegativeTtlMs;
    this.cache.set(hostname.toLowerCase(), {
      hostname: hostname.toLowerCase(),
      isNegative: true,
      expiresAt: Date.now() + ttl
    });
  }

  resolve(hostname) {
    const entry = this.cache.get(hostname.toLowerCase());
    if (!entry) return { hit: false };

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(hostname.toLowerCase());
      return { hit: false };
    }

    return {
      hit: true,
      address: entry.address,
      isNegative: entry.isNegative
    };
  }
}

test('DnsResolutionCache - handles positive overrides and bounded negative resolution caching', () => {
  const dns = new DnsResolutionCache(10000, 5000);
  dns.setPositive('api.internal.svc', '10.0.1.25');
  dns.setNegative('unknown.internal.svc');

  const hit1 = dns.resolve('api.internal.svc');
  assert.strictEqual(hit1.hit, true);
  assert.strictEqual(hit1.address, '10.0.1.25');

  const hit2 = dns.resolve('unknown.internal.svc');
  assert.strictEqual(hit2.hit, true);
  assert.strictEqual(hit2.isNegative, true);
});
