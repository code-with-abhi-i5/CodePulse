/**
 * Architecture Service: ClickHouse Data Deduping Engine
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-38]
 */

export class ClickHouseDataDedupingService {
  public generateReplacingMergeTreeDdl(
    tableName: string,
    primaryKeys: string[],
    versionColumn: string = 'version'
  ): string {
    return `CREATE TABLE IF NOT EXISTS ${tableName} (
  ${primaryKeys.map((pk) => `${pk} String`).join(',\n  ')},
  payload String,
  ${versionColumn} UInt64,
  event_time DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(${versionColumn})
ORDER BY (${primaryKeys.join(', ')});`;
  }

  public deduplicateInMemory<T extends { id: string; version: number }>(records: T[]): T[] {
    const latestMap = new Map<string, T>();
    for (const record of records) {
      const existing = latestMap.get(record.id);
      if (!existing || record.version >= existing.version) {
        latestMap.set(record.id, record);
      }
    }
    return Array.from(latestMap.values());
  }
}
