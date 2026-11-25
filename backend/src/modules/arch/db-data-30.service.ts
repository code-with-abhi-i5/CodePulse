/**
 * Architecture Service: ClickHouse Table Retention Cleaner
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-30]
 */

export class ClickHouseRetentionCleanerService {
  private retentionDays: number;

  constructor(retentionDays: number = 90) {
    this.retentionDays = retentionDays;
  }

  public getExpiredPartitions(
    activePartitions: Array<{ partitionName: string; partitionMonth: string }>,
    currentDate: Date = new Date()
  ): Array<{ partitionName: string; dropDdl: string }> {
    const cutoffDate = new Date(currentDate.getTime() - this.retentionDays * 86400000);
    const cutoffMonth = `${cutoffDate.getUTCFullYear()}${String(cutoffDate.getUTCMonth() + 1).padStart(2, '0')}`;

    const expired: Array<{ partitionName: string; dropDdl: string }> = [];

    for (const p of activePartitions) {
      if (p.partitionMonth < cutoffMonth) {
        expired.push({
          partitionName: p.partitionName,
          dropDdl: `ALTER TABLE telemetry_events DROP PARTITION '${p.partitionName}';`
        });
      }
    }

    return expired;
  }
}
