import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DnsLookupCacheAgentService } from './perf-scale-21.service.ts';

describe('DnsLookupCacheAgentService (PERF-SCALE-21)', () => {
  it('serves DNS resolutions from in-memory cache until TTL expiration', () => {
    const agent = new DnsLookupCacheAgentService(1000);
    agent.setResolution('api.codepulse.io', '192.168.1.10');

    const res1 = agent.resolve('api.codepulse.io');
    assert.strictEqual(res1.fromCache, true);
    assert.strictEqual(res1.ip, '192.168.1.10');
    assert.strictEqual(res1.isNegative, false);

    // After TTL expires
    const res2 = agent.resolve('api.codepulse.io', Date.now() + 2000);
    assert.strictEqual(res2.fromCache, false);
    assert.strictEqual(res2.ip, null);
  });

  it('manages negative caching for non-existent domains', () => {
    const agent = new DnsLookupCacheAgentService();
    agent.setNegativeResolution('invalid.domain.test');

    const res = agent.resolve('invalid.domain.test');
    assert.strictEqual(res.fromCache, true);
    assert.strictEqual(res.isNegative, true);
    assert.strictEqual(res.ip, null);
  });
});
