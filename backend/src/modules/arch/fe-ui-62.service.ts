/**
 * Architecture Service: Monaco Multi-File Tab Manager
 * Subsystem: Advanced Frontend Architecture & UI [FE-UI-62]
 */

export interface EditorTab {
  id: string;
  filePath: string;
  title: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
}

export class MonacoMultiFileTabManagerService {
  private tabs: Map<string, EditorTab>;
  private activeTabId: string | null;

  constructor() {
    this.tabs = new Map();
    this.activeTabId = null;
  }

  public openTab(filePath: string, title: string, content: string): EditorTab {
    if (this.tabs.has(filePath)) {
      this.activeTabId = filePath;
      return this.tabs.get(filePath)!;
    }

    const tab: EditorTab = {
      id: filePath,
      filePath,
      title,
      content,
      savedContent: content,
      isDirty: false
    };

    this.tabs.set(filePath, tab);
    this.activeTabId = filePath;
    return tab;
  }

  public updateContent(tabId: string, content: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.content = content;
    tab.isDirty = tab.content !== tab.savedContent;
  }

  public saveTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    tab.savedContent = tab.content;
    tab.isDirty = false;
  }

  public closeTab(tabId: string, force: boolean = false): { closed: boolean; promptConfirmation: boolean } {
    const tab = this.tabs.get(tabId);
    if (!tab) return { closed: false, promptConfirmation: false };

    if (tab.isDirty && !force) {
      return { closed: false, promptConfirmation: true };
    }

    this.tabs.delete(tabId);
    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.keys());
      this.activeTabId = remaining.length > 0 ? remaining[0] : null;
    }
    return { closed: true, promptConfirmation: false };
  }

  public getActiveTab(): EditorTab | null {
    if (!this.activeTabId) return null;
    return this.tabs.get(this.activeTabId) || null;
  }

  public getAllTabs(): EditorTab[] {
    return Array.from(this.tabs.values());
  }
}
