export interface OutboxRecord<T = any> {
  id: string;
  aggregateId: string;
  eventType: string;
  payload: T;
  published: boolean;
  createdAt: number;
}

export class TransactionalOutboxPublisher {
  private outbox: OutboxRecord[] = [];

  public appendEvent(aggregateId: string, eventType: string, payload: any): OutboxRecord {
    const record: OutboxRecord = {
      id: Math.random().toString(36).substring(2, 10),
      aggregateId,
      eventType,
      payload,
      published: false,
      createdAt: Date.now()
    };
    this.outbox.push(record);
    return record;
  }

  public async publishPending(publisherFn: (event: OutboxRecord) => Promise<void> | void): Promise<number> {
    const pending = this.outbox.filter(e => !e.published);
    for (const event of pending) {
      await publisherFn(event);
      event.published = true;
    }
    return pending.length;
  }

  public getPendingCount(): number {
    return this.outbox.filter(e => !e.published).length;
  }
}
