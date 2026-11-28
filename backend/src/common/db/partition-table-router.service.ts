import { PartitionRoutingResult } from '../../types/db';

export class PartitionTableRouterService {
  public computePartition(baseTableName: string, timestampMs: number = Date.now()): PartitionRoutingResult {
    const date = new Date(timestampMs);
    const partitionYear = date.getUTCFullYear();
    const partitionMonth = date.getUTCMonth() + 1;
    const partitionDay = date.getUTCDate();

    const monthStr = String(partitionMonth).padStart(2, '0');
    const dayStr = String(partitionDay).padStart(2, '0');

    const partitionTableName = `${baseTableName}_y${partitionYear}m${monthStr}d${dayStr}`;

    const startIso = `${partitionYear}-${monthStr}-${dayStr} 00:00:00+00`;
    const nextDate = new Date(Date.UTC(partitionYear, partitionMonth - 1, partitionDay + 1));
    const nextMonthStr = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
    const nextDayStr = String(nextDate.getUTCDate()).padStart(2, '0');
    const endIso = `${nextDate.getUTCFullYear()}-${nextMonthStr}-${nextDayStr} 00:00:00+00`;

    const createPartitionSql = `CREATE TABLE IF NOT EXISTS "${partitionTableName}" PARTITION OF "${baseTableName}" FOR VALUES FROM ('${startIso}') TO ('${endIso}');`;

    return {
      partitionTableName,
      partitionYear,
      partitionMonth,
      partitionDay,
      createPartitionSql
    };
  }
}
