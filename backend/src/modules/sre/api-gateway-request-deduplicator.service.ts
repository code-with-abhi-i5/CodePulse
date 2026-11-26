import crypto from 'crypto';
import { IdempotencyRecord } from '../../types/sre';

export class ApiGatewayRequestDeduplicator {
  private cache: Map<string, IdempotencyRecord> = new Map();
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  computeHash(payload: unknown): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload || '')).digest('hex');
  }

  evaluate(key: string, payload: unknown): { isDuplicate: boolean; record?: IdempotencyRecord } {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing) {
      if (now - existing.createdAt < this.windowMs) {
        return { isDuplicate: true, record: existing };
      }
      this.cache.delete(key);
    }

    const hash = this.computeHash(payload);
    const newRecord: IdempotencyRecord = {
      key,
      hash,
      status: 'in_flight',
      createdAt: now
    };
    this.cache.set(key, newRecord);
    return { isDuplicate: false, record: newRecord };
  }

  markCompleted(key: string, statusCode: number, responseBody: unknown): void {
    const rec = this.cache.get(key);
    if (rec) {
      rec.status = 'completed';
      rec.statusCode = statusCode;
      rec.responseBody = responseBody;
    }
  }
}
