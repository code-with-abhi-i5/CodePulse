import { Injectable } from '@nestjs/common';
import { CdcEvent } from '../../types/database';

@Injectable()
export class CdcStreamerService {
  captureWrite(table: string, op: 'INSERT' | 'UPDATE' | 'DELETE', before: any, after: any): CdcEvent {
    return {
      eventId: `cdc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      targetTable: `analytics_${table}`,
      payload: {
        op,
        before,
        after,
      },
    };
  }

  batchEventsForClickhouse(events: CdcEvent[]): Record<string, CdcEvent[]> {
    const batches: Record<string, CdcEvent[]> = {};
    for (const ev of events) {
      if (!batches[ev.targetTable]) batches[ev.targetTable] = [];
      batches[ev.targetTable].push(ev);
    }
    return batches;
  }
}
