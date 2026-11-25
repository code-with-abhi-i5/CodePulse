import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaNPlusOneDetectorService } from './db-data-23.service.ts';

describe('PrismaNPlusOneDetectorService (DB-DATA-23)', () => {
  it('detects repeated queries in same execution context and warns of N+1 vulnerability', () => {
    const detector = new PrismaNPlusOneDetectorService(3);

    detector.recordQuery('User', 'findUnique', 'where.id');
    detector.recordQuery('User', 'findUnique', 'where.id');
    const res = detector.recordQuery('User', 'findUnique', 'where.id');

    assert.strictEqual(res.isNPlusOne, true);
    assert.strictEqual(res.count, 3);
    assert.ok(res.warning.includes('Potential N+1 query detected'));
  });
});
