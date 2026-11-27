import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { OptimisticBookmarkRollbackService } from './optimistic-bookmark-rollback.service.ts';

describe('OptimisticBookmarkRollbackService [L2-ERROR-RETRY-OFFLINE-059]', () => {
  const service = new OptimisticBookmarkRollbackService();

  test('applies instant optimistic update and toggles status', () => {
    service.initialize([{ id: 'c1', title: 'Two Sum', bookmarked: false }]);
    const res = service.toggleBookmarkOptimistic('c1');
    assert.equal(res.previousState?.bookmarked, false);
    assert.equal(res.optimisticState.bookmarked, true);
    assert.equal(service.getBookmark('c1')?.bookmarked, true);
  });

  test('rolls back to previous state on mutation error', () => {
    service.initialize([{ id: 'c2', title: 'Binary Search', bookmarked: true }]);
    const res = service.toggleBookmarkOptimistic('c2');
    assert.equal(res.optimisticState.bookmarked, false);

    // Simulate mutation failure and rollback
    service.rollback('c2', res.previousState);
    assert.equal(service.getBookmark('c2')?.bookmarked, true);
  });

  test('handles edge case when toggling non-existent item in empty dataset', () => {
    service.initialize([]);
    const res = service.toggleBookmarkOptimistic('c3');
    assert.equal(res.previousState, null);
    assert.equal(res.optimisticState.bookmarked, true);

    service.rollback('c3', res.previousState);
    assert.equal(service.getBookmark('c3'), undefined);
  });
});
