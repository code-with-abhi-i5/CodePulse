/**
 * Architecture Service: Client Memory Leak Watchdog
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-17]
 */

export interface ListenerRecord {
  componentId: string;
  eventType: string;
  elementTag: string;
  registeredAt: number;
}

export class ClientMemoryLeakWatchdogService {
  private activeListeners: Map<string, ListenerRecord>;

  constructor() {
    this.activeListeners = new Map();
  }

  public registerListener(listenerId: string, record: ListenerRecord): void {
    this.activeListeners.set(listenerId, record);
  }

  public unregisterListener(listenerId: string): void {
    this.activeListeners.delete(listenerId);
  }

  public auditComponentUnmount(componentId: string): { leakedCount: number; leakedListeners: ListenerRecord[] } {
    const leaked: ListenerRecord[] = [];
    for (const [id, rec] of this.activeListeners.entries()) {
      if (rec.componentId === componentId) {
        leaked.push(rec);
        this.activeListeners.delete(id); // auto-cleanup to prevent compounding leaks
      }
    }
    return {
      leakedCount: leaked.length,
      leakedListeners: leaked
    };
  }

  public getActiveListenerCount(): number {
    return this.activeListeners.size;
  }
}
