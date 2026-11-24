import { Injectable, Logger } from '@nestjs/common';

export interface TombstoneKafkaRecord {
  topic: string;
  key: string;
  value: null; // null payload denotes a Kafka tombstone
  headers: {
    'kafka-tombstone': 'true';
    'deleted-at': string;
    'entity-type': string;
    'retention-ms': string;
  };
  timestamp: number;
}

export interface TombstoneOptions {
  entityType?: 'USER' | 'CHALLENGE' | 'REPO' | string;
  deleteRetentionMs?: number; // delete.retention.ms
}

@Injectable()
export class TombstoneCleanerService {
  private readonly logger = new Logger(TombstoneCleanerService.name);

  // Default Kafka delete.retention.ms: 24 hours (86,400,000 ms)
  private readonly defaultDeleteRetentionMs = 86400000;

  // Track tombstone keys to protect against zombie state revival during re-sync
  private readonly activeTombstoneKeys = new Map<string, number>();

  /**
   * Generates a standard Kafka null-payload tombstone record for key deletion.
   */
  public createTombstone(
    topic: string,
    entityKey: string,
    options?: TombstoneOptions
  ): TombstoneKafkaRecord {
    const now = Date.now();
    const retentionMs = options?.deleteRetentionMs ?? this.defaultDeleteRetentionMs;
    const entityType = options?.entityType ?? 'ENTITY';

    this.activeTombstoneKeys.set(`${topic}:${entityKey}`, now + retentionMs);

    this.logger.log(
      `Emitted tombstone record for key '${entityKey}' on topic '${topic}' (Type: ${entityType}, Retention: ${retentionMs}ms)`
    );

    return {
      topic,
      key: entityKey,
      value: null,
      headers: {
        'kafka-tombstone': 'true',
        'deleted-at': new Date(now).toISOString(),
        'entity-type': entityType,
        'retention-ms': retentionMs.toString(),
      },
      timestamp: now,
    };
  }

  /**
   * Zombie Protection Check: Ensures consumer re-sync never resurrects deleted entities
   * when late-arriving or historical event log offsets are replayed.
   */
  public isTombstoned(topic: string, entityKey: string, now = Date.now()): boolean {
    const expiresAt = this.activeTombstoneKeys.get(`${topic}:${entityKey}`);
    if (expiresAt === undefined) return false;

    if (now > expiresAt) {
      // Retention window passed; eligible for compaction GC
      return false;
    }

    return true;
  }

  /**
   * Purges tombstone markers whose delete.retention.ms has expired.
   */
  public cleanExpiredTombstones(now = Date.now()): number {
    let purgedCount = 0;
    for (const [key, expiresAt] of this.activeTombstoneKeys.entries()) {
      if (now > expiresAt) {
        this.activeTombstoneKeys.delete(key);
        purgedCount++;
      }
    }
    return purgedCount;
  }

  public getActiveTombstoneCount(): number {
    return this.activeTombstoneKeys.size;
  }

  public clear(): void {
    this.activeTombstoneKeys.clear();
  }
}
