import test from 'node:test';
import assert from 'node:assert/strict';

class SoftDeleteQueryRewriterService {
  rewriteSql(sql, targetTable = 'users') {
    let rewritten = sql;
    let count = 0;
    const regex = new RegExp('\\bFROM\\s+' + targetTable + '\\b', 'i');
    if (regex.test(sql)) {
      if (/\bWHERE\b/i.test(sql)) {
        rewritten = rewritten.replace(/\bWHERE\b/i, 'WHERE ' + targetTable + '.deleted_at IS NULL AND');
        count++;
      } else {
        rewritten += ' WHERE ' + targetTable + '.deleted_at IS NULL';
        count++;
      }
    }
    return { originalSql: sql, rewrittenSql: rewritten, injectedFiltersCount: count };
  }
}

test('SoftDeleteQueryRewriterService - injects deleted_at IS NULL filter automatically', () => {
  const rewriter = new SoftDeleteQueryRewriterService();
  const q1 = rewriter.rewriteSql('SELECT * FROM users');
  assert.equal(q1.rewrittenSql, 'SELECT * FROM users WHERE users.deleted_at IS NULL');

  const q2 = rewriter.rewriteSql('SELECT * FROM users WHERE active = true');
  assert.equal(q2.rewrittenSql, 'SELECT * FROM users WHERE users.deleted_at IS NULL AND active = true');
});
