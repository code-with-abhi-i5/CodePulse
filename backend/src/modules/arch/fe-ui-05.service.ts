/**
 * Architecture Service: Cross-Tab Synchronization Coordinator
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-05]
 */

export interface TabNode {
  tabId: string;
  joinedAt: number;
  lastHeartbeat: number;
}

export class CrossTabSyncCoordinatorService {
  private localTabId: string;
  private tabs: Map<string, TabNode>;
  private leaderId: string | null;

  constructor(localTabId: string = 'tab_' + Math.random().toString(36).substring(2, 9)) {
    this.localTabId = localTabId;
    this.tabs = new Map();
    this.leaderId = null;

    // Register local tab
    this.recordHeartbeat(this.localTabId);
  }

  public recordHeartbeat(tabId: string): void {
    const now = Date.now();
    const existing = this.tabs.get(tabId) || { tabId, joinedAt: now, lastHeartbeat: now };
    existing.lastHeartbeat = now;
    this.tabs.set(tabId, existing);
    this.reelectLeader();
  }

  public removeTab(tabId: string): void {
    this.tabs.delete(tabId);
    this.reelectLeader();
  }

  public purgeDeadTabs(timeoutMs: number = 5000): void {
    const now = Date.now();
    for (const [id, tab] of this.tabs.entries()) {
      if (now - tab.lastHeartbeat > timeoutMs) {
        this.tabs.delete(id);
      }
    }
    this.reelectLeader();
  }

  private reelectLeader(): void {
    if (this.tabs.size === 0) {
      this.leaderId = null;
      return;
    }

    // Eldest active tab becomes leader (Bully / FIFO election)
    let oldest: TabNode | null = null;
    for (const tab of this.tabs.values()) {
      if (!oldest || tab.joinedAt < oldest.joinedAt) {
        oldest = tab;
      }
    }
    this.leaderId = oldest ? oldest.tabId : null;
  }

  public getLeaderId(): string | null {
    return this.leaderId;
  }

  public isLocalTabLeader(): boolean {
    return this.leaderId === this.localTabId;
  }
}
