import { Injectable, Logger, Optional } from '@nestjs/common';
import { TombstoneCleanerService, TombstoneKafkaRecord } from './tombstone-cleaner.service';

export interface KafkaLogRecord<T = any> {
  offset: number;
  key: string;
  value: T | null; // null represents tombstone
  timestamp: number;
  headers?: Record<string, string>;
}

export interface CompactionReport {
  topic: string;
  inputRecordCount: number;
  outputRecordCount: number;
  tombstoneCount: number;
  recordsCompactedOut: number;
  storageReclaimedPercent: number;
  purgedEntityKeys: string[];
}

export interface CompactorTelemetry {
  totalCompactionRuns: number;
  totalRecordsProcessed: number;
  totalRecordsPurged: number;
  totalTombstonesProcessed: number;
  totalStorageReclaimedBytes: number;
}

@Injectable()
export class LogCompactorService {
  private readonly logger = new Logger(LogCompactorService.name);

  private totalRuns = 0;
  private totalProcessed = 0;
  private totalPurged = 0;
  private totalTombstones = 0;
  private totalReclaimedBytes = 0;

  private readonly tombstoneCleaner: TombstoneCleanerService;

  constructor(
    @Optional() tombstoneCleaner?: TombstoneCleanerService
  ) {
    this.tombstoneCleaner = tombstoneCleaner || new TombstoneCleanerService();
  }

  /**
   * Compacts an event log partition segment adhering to Kafka log compaction semantics.
   * Keeps only the latest non-tombstone record for each key. Tombstones purge previous records.
   */
  public compactPartitionLog<T>(topic: string, records: KafkaLogRecord<T>[]): {
    compacted: KafkaLogRecord<T>[];
    report: CompactionReport;
  } {
    this.totalRuns++;
    this.totalProcessed += records.length;

    const latestByKey = new Map<string, KafkaLogRecord<T>>();
    const purgedKeys = new Set<string>();
    let tombstoneCount = 0;

    for (const record of records) {
      if (record.value === null) {
        // Tombstone record encountered
        tombstoneCount++;
        this.totalTombstones++;
        purgedKeys.add(record.key);
        // Tombstone evicts previous versions
        latestByKey.delete(record.key);

        // Register with zombie protection cleaner
        this.tombstoneCleaner.createTombstone(topic, record.key);
      } else {
        // If not already deleted by an active tombstone in this compaction pass
        if (!purgedKeys.has(record.key)) {
          latestByKey.set(record.key, record);
        }
      }
    }

    const compacted = Array.from(latestByKey.values()).sort((a, b) => a.offset - b.offset);
    const recordsCompactedOut = records.length - compacted.length;
    this.totalPurged += recordsCompactedOut;

    const rawSize = records.reduce((acc, r) => acc + (r.value ? JSON.stringify(r.value).length : 32), 0);
    const compactedSize = compacted.reduce((acc, r) => acc + JSON.stringify(r.value).length, 0);
    const reclaimedBytes = Math.max(0, rawSize - compactedSize);
    this.totalReclaimedBytes += reclaimedBytes;

    const storageReclaimedPercent =
      rawSize > 0 ? Math.round(((rawSize - compactedSize) / rawSize) * 10000) / 100 : 0;

    const report: CompactionReport = {
      topic,
      inputRecordCount: records.length,
      outputRecordCount: compacted.length,
      tombstoneCount,
      recordsCompactedOut,
      storageReclaimedPercent,
      purgedEntityKeys: Array.from(purgedKeys),
    };

    this.logger.log(
      `Compacted topic '${topic}': ${records.length} -> ${compacted.length} records (${storageReclaimedPercent}% storage reclaimed, ${purgedKeys.size} tombstones purged)`
    );

    return { compacted, report };
  }

  /**
   * Consumer Projection Replay Filter: Prevents zombie revival during state re-sync.
   */
  public filterReplayedEvent<T>(topic: string, record: KafkaLogRecord<T>): boolean {
    if (record.value === null) return false;
    // Check if the entity was tombstoned
    if (this.tombstoneCleaner.isTombstoned(topic, record.key)) {
      this.logger.debug(
        `Suppressed replayed event for tombstoned key '${record.key}' on topic '${topic}' to prevent zombie resurrection.`
      );
      return false; // Suppress resurrection
    }
    return true;
  }

  public getTelemetry(): CompactorTelemetry {
    return {
      totalCompactionRuns: this.totalRuns,
      totalRecordsProcessed: this.totalProcessed,
      totalRecordsPurged: this.totalPurged,
      totalTombstonesProcessed: this.totalTombstones,
      totalStorageReclaimedBytes: this.totalReclaimedBytes,
    };
  }

  public clear(): void {
    this.totalRuns = 0;
    this.totalProcessed = 0;
    this.totalPurged = 0;
    this.totalTombstones = 0;
    this.totalReclaimedBytes = 0;
    this.tombstoneCleaner?.clear();
  }
}
