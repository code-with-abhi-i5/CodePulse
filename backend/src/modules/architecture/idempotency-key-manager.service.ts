export type IdempotencyState = 'PENDING' | 'COMMITTED' | 'ROLLEDBACK';

export interface IdempotencyRecord {
  key: string;
  state: IdempotencyState;
  result?: any;
  createdAt: number;
  expiresAt: number;
}

export class IdempotencyKeyReservationManager {
  private store = new Map<string, IdempotencyRecord>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs = 60000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  public reserveKey(key: string, ttlMs = this.defaultTtlMs): { reserved: boolean; existingRecord?: IdempotencyRecord } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing) {
      if (existing.expiresAt > now) {
        return { reserved: false, existingRecord: existing };
      }
      this.store.delete(key);
    }

    const record: IdempotencyRecord = {
      key,
      state: 'PENDING',
      createdAt: now,
      expiresAt: now + ttlMs
    };

    this.store.set(key, record);
    return { reserved: true, existingRecord: record };
  }

  public commit(key: string, result: any): void {
    const record = this.store.get(key);
    if (record) {
      record.state = 'COMMITTED';
      record.result = result;
    }
  }

  public rollback(key: string): void {
    this.store.delete(key);
  }
}
