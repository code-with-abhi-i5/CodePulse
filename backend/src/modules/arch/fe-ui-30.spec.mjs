import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PwaOfflineCacheManagerService } from './fe-ui-30.service.ts';

describe('PwaOfflineCacheManagerService (FE-UI-30)', () => {
  it('caches challenge starter kits and serves from cache when offline', () => {
    const pwa = new PwaOfflineCacheManagerService();
    const url = '/api/challenges/123/starter-kit';

    // Online fetch caches data
    const res1 = pwa.resolveFetchStrategy(url, true, () => 'console.log("Starter Code");');
    assert.strictEqual(res1.source, 'NETWORK');
    assert.strictEqual(res1.body, 'console.log("Starter Code");');

    // Offline fetch returns from cache
    const res2 = pwa.resolveFetchStrategy(url, false, () => { throw new Error('Network error'); });
    assert.strictEqual(res2.source, 'CACHE');
    assert.strictEqual(res2.body, 'console.log("Starter Code");');
  });
});
