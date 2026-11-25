import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SoftDeleteCascadingFilterMiddleware } from './db-data-06.service.ts';

describe('SoftDeleteCascadingFilterMiddleware (DB-DATA-06)', () => {
  it('recursively injects isDeleted: false into parent and nested relations', () => {
    const middleware = new SoftDeleteCascadingFilterMiddleware();
    const filtered = middleware.applyFilter({
      where: { status: 'ACTIVE' },
      include: {
        battles: true,
        submissions: { where: { score: 100 } }
      }
    });

    assert.strictEqual(filtered.where.isDeleted, false);
    assert.strictEqual(filtered.where.status, 'ACTIVE');
    assert.strictEqual(filtered.include.battles.where.isDeleted, false);
    assert.strictEqual(filtered.include.submissions.where.isDeleted, false);
  });

  it('cascades soft-deletion to child entities', () => {
    const middleware = new SoftDeleteCascadingFilterMiddleware();
    const children = [
      { id: 'c1', parentId: 'p1', isDeleted: false },
      { id: 'c2', parentId: 'p1', isDeleted: false },
      { id: 'c3', parentId: 'p2', isDeleted: false }
    ];

    const affected = middleware.cascadeSoftDelete('p1', children);
    assert.deepStrictEqual(affected, ['c1', 'c2']);
    assert.strictEqual(children[0].isDeleted, true);
    assert.strictEqual(children[2].isDeleted, false);
  });
});
