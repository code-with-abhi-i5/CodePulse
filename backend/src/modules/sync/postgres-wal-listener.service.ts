import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

export type WalOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface WalChangeRecord {
  lsn: string;
  xid: number;
  commitTimestamp: number;
  table: string;
  schema: string;
  operation: WalOperation;
  beforeImage?: Record<string, unknown>;
  afterImage?: Record<string, unknown>;
}

export interface ReplicationSlotStatus {
  slotName: string;
  plugin: string;
  active: boolean;
  confirmedFlushLsn: string;
  restartLsn: string;
  totalChangesCaptured: number;
  lagBytes: number;
}

export type WalChangeCallback = (change: WalChangeRecord) => void | Promise<void>;

@Injectable()
export class PostgresWalListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostgresWalListenerService.name);
  private readonly slotName = 'codepulse_cdc_slot';
  private readonly subscribers = new Set<WalChangeCallback>();
  private active = false;
  private currentLsn = '0/16B0000';
  private totalCaptured = 0;
  private lsnSequence = 1486848;

  onModuleInit(): void {
    this.logger.log(`Initializing PostgresWalListener on slot '${this.slotName}'...`);
    this.active = true;
  }

  onModuleDestroy(): void {
    this.logger.log(`Stopping PostgresWalListener on slot '${this.slotName}'...`);
    this.active = false;
    this.subscribers.clear();
  }

  public subscribe(callback: WalChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Ingests and processes a raw WAL decoded transaction commit.
   * Simulates/wraps the pg-logical-replication stream message parsing.
   */
  public async handleWalChange(
    table: string,
    operation: WalOperation,
    afterImage?: Record<string, unknown>,
    beforeImage?: Record<string, unknown>,
    schema = 'public',
  ): Promise<WalChangeRecord> {
    if (!this.active) {
      throw new Error('WAL listener is not active');
    }

    this.lsnSequence += 64;
    const lsn = `0/${this.lsnSequence.toString(16).toUpperCase()}`;
    this.currentLsn = lsn;
    this.totalCaptured++;

    const record: WalChangeRecord = {
      lsn,
      xid: 100000 + this.totalCaptured,
      commitTimestamp: Date.now(),
      table,
      schema,
      operation,
      beforeImage,
      afterImage,
    };

    // Dispatch to subscribers with parallel execution
    const promises = Array.from(this.subscribers).map(async (sub) => {
      try {
        await sub(record);
      } catch (err) {
        this.logger.error(`Error in WAL subscriber: ${(err as Error).message}`);
      }
    });

    await Promise.all(promises);
    return record;
  }

  public getSlotStatus(): ReplicationSlotStatus {
    return {
      slotName: this.slotName,
      plugin: 'pgoutput',
      active: this.active,
      confirmedFlushLsn: this.currentLsn,
      restartLsn: this.currentLsn,
      totalChangesCaptured: this.totalCaptured,
      lagBytes: 0,
    };
  }
}
