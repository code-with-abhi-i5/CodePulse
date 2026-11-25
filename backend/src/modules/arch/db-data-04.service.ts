/**
 * Architecture Service: PostgreSQL Table Partitioning Strategy
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-04]
 */

export class PostgreSqlTablePartitioningService {
  public generateMonthlyPartitionDdl(tableName: string, year: number, month: number): {
    partitionName: string;
    ddl: string;
    rangeStart: string;
    rangeEnd: string;
  } {
    const padMonth = String(month).padStart(2, '0');
    const partitionName = `${tableName}_y${year}m${padMonth}`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const padNextMonth = String(nextMonth).padStart(2, '0');

    const rangeStart = `${year}-${padMonth}-01 00:00:00`;
    const rangeEnd = `${nextYear}-${padNextMonth}-01 00:00:00`;

    const ddl = `CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF ${tableName} FOR VALUES FROM ('${rangeStart}') TO ('${rangeEnd}');`;

    return { partitionName, ddl, rangeStart, rangeEnd };
  }

  public resolvePartitionName(tableName: string, date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${tableName}_y${y}m${m}`;
  }
}
