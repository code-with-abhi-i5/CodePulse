import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseIndexBloatDetectorService } from './db-data-07.service.ts';

describe('DatabaseIndexBloatDetectorService (DB-DATA-07)', () => {
  it('detects bloated indexes and generates online non-blocking reindex DDL', () => {
    const detector = new DatabaseIndexBloatDetectorService(0.3);
    const indexes = [
      { tableName: 'users', indexName: 'idx_users_email', totalSizeBytes: 100_000, bloatSizeBytes: 45_000 }, // 45% bloat
      { tableName: 'submissions', indexName: 'idx_sub_created', totalSizeBytes: 100_000, bloatSizeBytes: 10_000 } // 10% bloat
    ];

    const results = detector.detectBloatedIndexes(indexes);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].indexName, 'idx_users_email');
    assert.strictEqual(results[0].reindexCommand, 'REINDEX INDEX CONCURRENTLY idx_users_email;');
  });
});
