import test from 'node:test';
import assert from 'node:assert/strict';

class KeysetPaginatorService {
  encodeCursor(score, id) {
    return Buffer.from(score + ':' + id, 'utf8').toString('base64');
  }

  decodeCursor(cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const parts = decoded.split(':');
      return { score: Number(parts[0]), id: parts[1] };
    } catch {
      return null;
    }
  }

  buildWhereClause(score, id) {
    return {
      sql: '(score < ? OR (score = ? AND id < ?))',
      params: [score, score, id]
    };
  }
}

test('KeysetPaginatorService - encodes opaque cursors and constructs stable keyset SQL', () => {
  const paginator = new KeysetPaginatorService();
  const cursor = paginator.encodeCursor(2500, 'user-99');
  assert.ok(cursor.length > 0);

  const decoded = paginator.decodeCursor(cursor);
  assert.equal(decoded.score, 2500);
  assert.equal(decoded.id, 'user-99');

  const clause = paginator.buildWhereClause(decoded.score, decoded.id);
  assert.equal(clause.sql, '(score < ? OR (score = ? AND id < ?))');
});
