/**
 * Architecture Service: ClickHouse Columnar Data Compaction Scheduler
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-12]
 */

export interface ClickHousePartInfo {
  tableName: string;
  partition: string;
  activePartsCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
}

export class ClickHouseCompactionSchedulerService {
  private maxPartsThreshold: number;

  constructor(maxPartsThreshold: number = 10) {
    this.maxPartsThreshold = maxPartsThreshold;
  }

  public evaluateCompaction(parts: ClickHousePartInfo[]): Array<{
    tableName: string;
    partition: string;
    optimizeDdl: string;
    compressionRatio: number;
  }> {
    const scheduled: Array<{ tableName: string; partition: string; optimizeDdl: string; compressionRatio: number }> = [];

    for (const part of parts) {
      if (part.activePartsCount >= this.maxPartsThreshold) {
        const compressionRatio = part.compressedBytes > 0 ? part.uncompressedBytes / part.compressedBytes : 1.0;
        scheduled.push({
          tableName: part.tableName,
          partition: part.partition,
          optimizeDdl: `OPTIMIZE TABLE ${part.tableName} PARTITION '${part.partition}' FINAL;`,
          compressionRatio: Number(compressionRatio.toFixed(2))
        });
      }
    }

    return scheduled;
  }
}
