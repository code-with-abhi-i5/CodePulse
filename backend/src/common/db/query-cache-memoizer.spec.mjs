import test from 'node:test';
import assert from 'node:assert/strict';

class QueryCacheMemoizerService {
  constructor() {
    this.cache = new Map();
  }
  get(hash) {
    const entry = this.cache.get(hash);
    if (entry) return { isHit: true, cachedRows: entry.rows };
    return { isHit: false };
  }
  set(hash, rows, tables) {
    this.cache.set(hash, { rows, tables });
  }
  invalidate(tableName) {
    for (const [k, v] of this.cache.entries()) {
      if (v.tables.includes(tableName)) this.cache.delete(k);
    }
  }
}

test('QueryCacheMemoizerService - returns cached results and purges on table invalidation', () => {
  const memoizer = new QueryCacheMemoizerService();
  memoizer.set('q-users', [{ id: 1 }], ['users']);

  assert.equal(memoizer.get('q-users').isHit, true);
  memoizer.invalidate('users');
  assert.equal(memoizer.get('q-users').isHit, false);
});
