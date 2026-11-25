/**
 * Architecture Service: ClickHouse Dictionary Cache Preloader
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-42]
 */

export class ClickHouseDictionaryPreloaderService {
  public generateDictionaryDdl(
    dictionaryName: string,
    sourcePostgresTable: string,
    keyField: string,
    lifetimeSeconds: number = 3600
  ): string {
    return `CREATE DICTIONARY IF NOT EXISTS ${dictionaryName} (
  ${keyField} UInt64,
  name String,
  tier String,
  is_active UInt8
) PRIMARY KEY ${keyField}
SOURCE(POSTGRESQL(TABLE '${sourcePostgresTable}'))
LAYOUT(HASHED())
LIFETIME(MIN ${lifetimeSeconds} MAX ${lifetimeSeconds * 2});`;
  }

  public generatePreloadQuery(dictionaryName: string): string {
    return `SYSTEM RELOAD DICTIONARY ${dictionaryName};`;
  }
}
