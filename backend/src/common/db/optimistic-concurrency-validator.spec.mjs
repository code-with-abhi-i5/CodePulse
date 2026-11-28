import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class OptimisticConcurrencyValidatorService {
  validateVersion(currentVersion, expectedVersion) {
    const conflictDetected = currentVersion !== expectedVersion;
    const canUpdate = !conflictDetected;

    return {
      canUpdate,
      currentVersion,
      expectedVersion,
      conflictDetected,
      sqlPredicate: 'version = ' + expectedVersion
    };
  }

  buildConditionalUpdateSql(tableName, id, expectedVersion, updates) {
    const nextVersion = expectedVersion + 1;
    const setClauses = ['"version" = $1'];
    const values = [nextVersion];

    let paramIdx = 2;
    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'version' && key !== 'id') {
        setClauses.push('"' + key + '" = $' + paramIdx);
        values.push(val);
        paramIdx++;
      }
    }

    const idParam = paramIdx++;
    const versionParam = paramIdx;
    values.push(id, expectedVersion);

    const sql = 'UPDATE "' + tableName + '" SET ' + setClauses.join(', ') + ' WHERE "id" = $' + idParam + ' AND "version" = $' + versionParam + ';';

    return { sql, values, nextVersion };
  }
}

describe('OptimisticConcurrencyValidatorService', () => {
  const occ = new OptimisticConcurrencyValidatorService();

  it('validates matching versions and flags version conflicts', () => {
    const valid = occ.validateVersion(3, 3);
    assert.equal(valid.canUpdate, true);
    assert.equal(valid.conflictDetected, false);

    const conflict = occ.validateVersion(4, 3);
    assert.equal(conflict.canUpdate, false);
    assert.equal(conflict.conflictDetected, true);
  });

  it('constructs atomic conditional UPDATE statements with incremented version', () => {
    const { sql, values, nextVersion } = occ.buildConditionalUpdateSql('challenges', 42, 5, {
      title: 'Updated Challenge Title',
      difficulty: 'HARD'
    });

    assert.equal(nextVersion, 6);
    assert.ok(sql.includes('UPDATE "challenges" SET "version" = $1, "title" = $2, "difficulty" = $3 WHERE "id" = $4 AND "version" = $5;'));
    assert.deepEqual(values, [6, 'Updated Challenge Title', 'HARD', 42, 5]);
  });
});
