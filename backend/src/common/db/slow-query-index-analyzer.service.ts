import { IndexRecommendation } from '../../types/db';

export class SlowQueryIndexAnalyzerService {
  public analyzeQuery(
    tableName: string,
    sqlQuery: string
  ): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const normalized = sqlQuery.toLowerCase();

    // Check for JSONB containment operator (@>)
    if (sqlQuery.includes('@>') || normalized.includes('jsonb_path_query') || normalized.includes('jsonb_exists')) {
      // Look for target column
      const match = sqlQuery.match(/([a-zA-Z0-9_]+)\s*@>/);
      const jsonCol = match ? match[1] : 'metadata';
      const cleanCol = jsonCol.replace(/[^a-zA-Z0-9_]/g, '');
      const idxName = `idx_${tableName}_${cleanCol}_gin`;
      recommendations.push({
        tableName,
        indexType: 'gin',
        columns: [cleanCol],
        reason: 'JSONB containment queries require GIN indexing for high-speed key/value lookups',
        recommendedSql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${idxName}" ON "${tableName}" USING gin ("${cleanCol}");`
      });
    }

    // Check for composite filter and order by: WHERE colA = ... AND colB = ... ORDER BY colC
    const whereMatch = normalized.match(/wheres+(.*?)(?:orders+by|groups+by|limit|$)/s);
    const orderMatch = normalized.match(/orders+bys+([a-zA-Z0-9_,s]+)(?:limit|$)/);

    if (whereMatch) {
      const whereClause = whereMatch[1];
      const equalityCols = Array.from(whereClause.matchAll(/([a-zA-Z0-9_]+)s*=/g)).map(m => m[1]);
      let orderCols: string[] = [];
      if (orderMatch) {
        orderCols = orderMatch[1].split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
      }

      const compositeCols = Array.from(new Set([...equalityCols, ...orderCols]));
      if (compositeCols.length >= 2) {
        const colList = compositeCols.join('_');
        const idxName = `idx_${tableName}_${colList}`;
        const quotedCols = compositeCols.map(c => `"${c}"`).join(', ');
        recommendations.push({
          tableName,
          indexType: 'btree_composite',
          columns: compositeCols,
          reason: 'Multi-column equality and sort pattern benefits from composite B-Tree index',
          recommendedSql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "${idxName}" ON "${tableName}" (${quotedCols});`
        });
      }
    }

    return recommendations;
  }
}
