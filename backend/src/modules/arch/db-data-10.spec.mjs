import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseQueryCacheWithCdcInvalidationService } from './db-data-10.service.ts';

describe('DatabaseQueryCacheWithCdcInvalidationService (DB-DATA-10)', () => {
  it('stores cached queries and invalidates affected keys upon receiving CDC mutation event', () => {
    const cacheService = new DatabaseQueryCacheWithCdcInvalidationService();
    cacheService.set('user:101:profile', { name: 'Alice' }, ['users:101', 'users']);
    cacheService.set('user:202:profile', { name: 'Bob' }, ['users:202', 'users']);

    assert.deepStrictEqual(cacheService.get('user:101:profile'), { name: 'Alice' });

    // CDC event for user 101 update
    const invalidated = cacheService.handleCdcEvent('users', '101');
    assert.strictEqual(invalidated, 1);
    assert.strictEqual(cacheService.get('user:101:profile'), null);
    assert.deepStrictEqual(cacheService.get('user:202:profile'), { name: 'Bob' });
  });
});
