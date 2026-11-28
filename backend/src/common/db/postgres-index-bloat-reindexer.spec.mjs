import test from 'node:test';
import assert from 'node:assert/strict';

class PostgresIndexBloatReindexerService {
  evaluateIndex(tableName, indexName, bloatPercentage) {
    return {
      indexName,
      tableName,
      bloatPercentage,
      isEligibleForReindex: bloatPercentage >= 35.0,
      reindexSql: 'REINDEX INDEX CONCURRENTLY ' + indexName + ';'
    };
  }
}

test('PostgresIndexBloatReindexerService - marks indexes with >35% bloat for concurrent reindexing', () => {
  const service = new PostgresIndexBloatReindexerService();
  const healthy = service.evaluateIndex('users', 'idx_users_email', 12.5);
  assert.equal(healthy.isEligibleForReindex, false);

  const bloated = service.evaluateIndex('battles', 'idx_battles_status', 48.2);
  assert.equal(bloated.isEligibleForReindex, true);
  assert.equal(bloated.reindexSql, 'REINDEX INDEX CONCURRENTLY idx_battles_status;');
});
