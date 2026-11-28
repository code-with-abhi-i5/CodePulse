import { LogicalReplicationEvent } from '../../types/db';

export class LogicalReplicationConsumerService {
  private readonly subscribers = new Map<string, Array<(event: LogicalReplicationEvent) => void>>();

  public subscribe(table: string, handler: (event: LogicalReplicationEvent) => void): void {
    const existing = this.subscribers.get(table) || [];
    existing.push(handler);
    this.subscribers.set(table, existing);
  }

  public parseWal2JsonPayload(rawPayload: {
    change: Array<{
      kind: 'insert' | 'update' | 'delete';
      schema: string;
      table: string;
      columnnames?: string[];
      columnvalues?: unknown[];
    }>;
    timestamp?: string;
    xid?: number;
  }): LogicalReplicationEvent[] {
    const events: LogicalReplicationEvent[] = [];
    const txId = rawPayload.xid || Date.now();
    const commitTimestamp = rawPayload.timestamp ? Date.parse(rawPayload.timestamp) : Date.now();

    for (const item of rawPayload.change) {
      const data: Record<string, unknown> = {};
      if (item.columnnames && item.columnvalues) {
        item.columnnames.forEach((col, idx) => {
          data[col] = item.columnvalues?.[idx];
        });
      }

      const action = item.kind.toUpperCase() as 'INSERT' | 'UPDATE' | 'DELETE';
      events.push({
        table: item.table,
        action,
        commitTimestamp,
        txId,
        data
      });
    }

    return events;
  }

  public dispatchEvents(events: LogicalReplicationEvent[]): number {
    let dispatched = 0;
    for (const event of events) {
      const handlers = this.subscribers.get(event.table);
      if (handlers && handlers.length > 0) {
        handlers.forEach(h => {
          h(event);
          dispatched++;
        });
      }
    }
    return dispatched;
  }
}
