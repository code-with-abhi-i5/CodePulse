import { RewrittenSqlResult } from '../../types/db';

export class SoftDeleteQueryRewriterService {
  rewriteSql(sql: string, targetTable: string = 'users'): RewrittenSqlResult {
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

    return {
      originalSql: sql,
      rewrittenSql: rewritten,
      injectedFiltersCount: count
    };
  }
}
