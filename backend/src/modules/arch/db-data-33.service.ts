/**
 * Architecture Service: Database Index Suggestion Engine
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-33]
 */

export interface SlowQueryLog {
  table: string;
  whereColumns: string[];
  joinColumns?: string[];
  frequency: number;
}

export class DatabaseIndexSuggestionEngineService {
  public suggestIndexes(logs: SlowQueryLog[], frequencyThreshold: number = 5): Array<{
    table: string;
    columns: string[];
    indexDdl: string;
    score: number;
  }> {
    const suggestions: Array<{ table: string; columns: string[]; indexDdl: string; score: number }> = [];

    for (const log of logs) {
      if (log.frequency >= frequencyThreshold && log.whereColumns.length > 0) {
        const cols = Array.from(new Set([...log.whereColumns, ...(log.joinColumns || [])]));
        const idxName = `idx_${log.table}_${cols.join('_')}`;
        const indexDdl = `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${idxName} ON ${log.table} (${cols.join(', ')});`;

        suggestions.push({
          table: log.table,
          columns: cols,
          indexDdl,
          score: log.frequency
        });
      }
    }

    return suggestions.sort((a, b) => b.score - a.score);
  }
}
