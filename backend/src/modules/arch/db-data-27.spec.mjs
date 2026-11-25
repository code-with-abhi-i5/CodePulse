import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSchemaDriftDetectorService } from './db-data-27.service.ts';

describe('DatabaseSchemaDriftDetectorService (DB-DATA-27)', () => {
  it('detects missing columns and data type mismatches between schemas', () => {
    const detector = new DatabaseSchemaDriftDetectorService();
    const expected = {
      tables: {
        users: { id: 'String', email: 'String', score: 'Int' }
      }
    };
    const actual = {
      tables: {
        users: { id: 'String', email: 'String', score: 'BigInt' } // mismatch
      }
    };

    const diff = detector.compareSchemas(expected, actual);
    assert.strictEqual(diff.hasDrift, true);
    assert.strictEqual(diff.typeMismatches.length, 1);
    assert.ok(diff.typeMismatches[0].includes('users.score expected Int but found BigInt'));
  });
});
