import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseIndexSuggestionEngineService } from './db-data-33.service.ts';

describe('DatabaseIndexSuggestionEngineService (DB-DATA-33)', () => {
  it('analyzes slow query logs and suggests optimal composite indexes', () => {
    const engine = new DatabaseIndexSuggestionEngineService();
    const logs = [
      { table: 'submissions', whereColumns: ['challenge_id', 'status'], joinColumns: ['user_id'], frequency: 15 },
      { table: 'users', whereColumns: ['email'], frequency: 2 } // below threshold
    ];

    const suggestions = engine.suggestIndexes(logs, 5);
    assert.strictEqual(suggestions.length, 1);
    assert.strictEqual(suggestions[0].table, 'submissions');
    assert.ok(suggestions[0].indexDdl.includes('idx_submissions_challenge_id_status_user_id'));
  });
});
