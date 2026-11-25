/**
 * Architecture Service: GraphQL Subscription Engine with Redis Streams
 * Subsystem: Real-Time Event Dispatch
 */

export interface SubscriptionEvent {
  topic: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export class GraphqlSubscriptionStreamService {
  private readonly listeners = new Map<string, Set<(event: SubscriptionEvent) => void>>();

  public subscribe(topic: string, callback: (event: SubscriptionEvent) => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);

    return () => {
      this.listeners.get(topic)?.delete(callback);
    };
  }

  public publish(topic: string, payload: Record<string, unknown>): number {
    const event: SubscriptionEvent = {
      topic,
      payload,
      timestamp: Date.now()
    };
    const callbacks = this.listeners.get(topic);
    if (!callbacks || callbacks.size === 0) return 0;
    for (const cb of callbacks) {
      cb(event);
    }
    return callbacks.size;
  }
}
