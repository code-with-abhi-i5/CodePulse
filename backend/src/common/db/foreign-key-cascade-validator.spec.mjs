import test from 'node:test';
import assert from 'node:assert/strict';

class ForeignKeyCascadeValidatorService {
  validateCascade(parentEntity, parentId, dependentCounts) {
    const total = dependentCounts.reduce((acc, c) => acc + c, 0);
    const isSafe = total <= 50;
    return {
      parentEntity,
      parentId,
      dependentRecordCount: total,
      isSafeToDelete: isSafe,
      warning: isSafe ? undefined : 'Unsafe cascade: ' + total + ' records affected'
    };
  }
}

test('ForeignKeyCascadeValidatorService - flags bulk cascade deletions impacting >50 dependents', () => {
  const service = new ForeignKeyCascadeValidatorService();
  const safe = service.validateCascade('User', 'u-1', [3, 2]);
  assert.equal(safe.isSafeToDelete, true);
  assert.equal(safe.dependentRecordCount, 5);

  const bulk = service.validateCascade('Organization', 'org-99', [40, 30, 20]);
  assert.equal(bulk.isSafeToDelete, false);
  assert.ok(bulk.warning !== undefined);
});
