import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ForeignKeyIntegrityCrawlerService } from './db-data-18.service.ts';

describe('ForeignKeyIntegrityCrawlerService (DB-DATA-18)', () => {
  it('crawls child table records and detects orphaned references', () => {
    const crawler = new ForeignKeyIntegrityCrawlerService();
    const parentIds = new Set(['user-1', 'user-2']);
    const childRows = [
      { id: 'sub-1', userId: 'user-1' },
      { id: 'sub-2', userId: 'user-999' }, // orphan
      { id: 'sub-3', userId: 'user-2' }
    ];

    const orphaned = crawler.findOrphanedRows(
      { childTable: 'submissions', childForeignKey: 'userId', parentTable: 'users', parentPrimaryKey: 'id' },
      parentIds,
      childRows
    );

    assert.strictEqual(orphaned.length, 1);
    assert.strictEqual(orphaned[0].childId, 'sub-2');
    assert.strictEqual(orphaned[0].invalidForeignKey, 'user-999');
  });
});
