import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticalQueryMemoizationCacheService } from './perf-scale-20.service.ts';

describe('AnalyticalQueryMemoizationCacheService (PERF-SCALE-20)', () => {
  it('memoizes analytical queries and invalidates automatically on table insert', () => {
    const cache = new AnalyticalQueryMemoizationCacheService();
    cache.set('q-analytics-1', ['submissions', 'users'], { totalRuns: 1000 });
    cache.set('q-analytics-2', ['tournaments'], { activeTournaments: 5 });

    assert.deepStrictEqual(cache.get('q-analytics-1'), { totalRuns: 1000 });
    assert.deepStrictEqual(cache.get('q-analytics-2'), { activeTournaments: 5 });

    // Insert on submissions table
    const invalidated = cache.onTableInsert('submissions');
    assert.strictEqual(invalidated, 1);
    assert.strictEqual(cache.get('q-analytics-1'), null);
    assert.deepStrictEqual(cache.get('q-analytics-2'), { activeTournaments: 5 }); // untouched
  });
});
