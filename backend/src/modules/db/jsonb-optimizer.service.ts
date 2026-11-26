import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonbOptimizerService {
  generateGinIndexSql(tableName: string, column: string, pathExpression?: string): string {
    const indexName = `idx_${tableName}_${column}_${pathExpression ? pathExpression.replace(/[^a-zA-Z0-9]/g, '_') : 'gin'}`;
    if (pathExpression) {
      return `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${tableName} USING gin ((${column} -> '${pathExpression}'));`;
    }
    return `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName} ON ${tableName} USING gin (${column} jsonb_path_ops);`;
  }

  extractQueryablePaths(payload: Record<string, any>, prefix: string = ''): string[] {
    const paths: string[] = [];
    for (const [key, value] of Object.entries(payload)) {
      const full = prefix ? `${prefix}.${key}` : key;
      paths.push(full);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(...this.extractQueryablePaths(value, full));
      }
    }
    return paths;
  }
}
