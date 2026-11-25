/**
 * Architecture Service: Automated Database Schema Drift Detector
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-27]
 */

export interface SchemaDefinition {
  tables: Record<string, Record<string, string>>; // table -> { column: type }
}

export class DatabaseSchemaDriftDetectorService {
  public compareSchemas(expected: SchemaDefinition, actual: SchemaDefinition): {
    hasDrift: boolean;
    missingTables: string[];
    missingColumns: string[];
    typeMismatches: string[];
  } {
    const missingTables: string[] = [];
    const missingColumns: string[] = [];
    const typeMismatches: string[] = [];

    for (const [table, cols] of Object.entries(expected.tables)) {
      if (!actual.tables[table]) {
        missingTables.push(table);
        continue;
      }

      const actualCols = actual.tables[table];
      for (const [col, expectedType] of Object.entries(cols)) {
        if (!actualCols[col]) {
          missingColumns.push(`${table}.${col}`);
        } else if (actualCols[col].toLowerCase() !== expectedType.toLowerCase()) {
          typeMismatches.push(`${table}.${col} expected ${expectedType} but found ${actualCols[col]}`);
        }
      }
    }

    const hasDrift = missingTables.length > 0 || missingColumns.length > 0 || typeMismatches.length > 0;
    return { hasDrift, missingTables, missingColumns, typeMismatches };
  }
}
