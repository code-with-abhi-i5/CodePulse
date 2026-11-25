/**
 * Architecture Service: Webhook Event Ordering Reconciler
 * Subsystem: Webhook Processing & Sequential State Reconciliation
 */

export interface OrderedWebhookEvent {
  entityId: string;
  sequenceNumber: number;
  data: unknown;
}

export class WebhookEventOrderingReconcilerService {
  private readonly nextExpected = new Map<string, number>(); // entityId -> nextSequence
  private readonly buffer = new Map<string, Map<number, unknown>>(); // entityId -> (sequence -> data)

  public processEvent(event: OrderedWebhookEvent): unknown[] {
    const current = this.nextExpected.get(event.entityId) || 1;
    if (!this.buffer.has(event.entityId)) {
      this.buffer.set(event.entityId, new Map());
    }

    if (event.sequenceNumber < current) {
      return []; // Already processed
    }

    this.buffer.get(event.entityId)!.set(event.sequenceNumber, event.data);

    const released: unknown[] = [];
    let seq = current;
    const entityBuf = this.buffer.get(event.entityId)!;

    while (entityBuf.has(seq)) {
      released.push(entityBuf.get(seq));
      entityBuf.delete(seq);
      seq++;
    }

    this.nextExpected.set(event.entityId, seq);
    return released;
  }
}
