/**
 * Architecture Service: Distributed Change Data Capture (CDC) Pipeline
 * Subsystem: Database Scalability, Integrity & Analytics [DB-DATA-08]
 */

export interface WalChangeEvent {
  lsn: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: number;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface KafkaCdcMessage {
  topic: string;
  key: string;
  value: {
    eventId: string;
    table: string;
    op: string;
    timestamp: number;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  };
}

export class DistributedCdcPipelineService {
  public transformToKafkaMessage(event: WalChangeEvent, primaryKeyField: string = 'id'): KafkaCdcMessage {
    const keyVal = event.after ? String(event.after[primaryKeyField] || 'unknown') : event.before ? String(event.before[primaryKeyField] || 'unknown') : 'unknown';
    const topic = `cdc.events.${event.table}`;

    return {
      topic,
      key: keyVal,
      value: {
        eventId: `${event.table}-${event.lsn}`,
        table: event.table,
        op: event.operation,
        timestamp: event.timestamp,
        before: event.before || null,
        after: event.after || null
      }
    };
  }
}
